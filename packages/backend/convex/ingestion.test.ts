import { convexTest } from 'convex-test';
import type { Source } from '@bratura/shared/entities/source/entity';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { internal } from './_generated/api';
import { ingestionRunLeaseMs } from './ingestion';
import { mapasOpportunity } from './model/mapasCulturais/mapasOpportunity.fixture';
import schema from './schema';
import { federalMapasSource } from './sources.fixture';
import { modules } from './test.setup';

const newsSite: Source = {
  kind: 'newsSite',
  slug: 'news',
  name: 'News',
  isActive: true,
  robotsCheckedOn: '2026-11-13',
  termsCheckedOn: '2026-11-13',
  siteUrl: 'https://example.com.br',
};

function mapasAnswers(body: unknown, status = 200) {
  const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function withSource(source: Source = federalMapasSource) {
  const t = convexTest(schema, modules);
  const sourceId = await t.mutation(internal.sources.addSource, { source });
  return { t, sourceId };
}

const runsOf = (t: ReturnType<typeof convexTest>) =>
  t.run((ctx) => ctx.db.query('ingestionRuns').collect());

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('scheduleDailyIngestion', () => {
  test('reads every active source that has a reader, each in its own run', async () => {
    vi.useFakeTimers();
    mapasAnswers([mapasOpportunity()]);
    const t = convexTest(schema, modules);
    const addSource = internal.sources.addSource;
    await t.mutation(addSource, { source: federalMapasSource });
    await t.mutation(addSource, {
      source: {
        ...federalMapasSource,
        slug: 'mapas-ce',
        baseUrl: 'https://mapacultural.secult.ce.gov.br',
      },
    });
    await t.mutation(addSource, {
      source: { ...federalMapasSource, slug: 'mapas-off', isActive: false },
    });
    await t.mutation(addSource, { source: newsSite });

    expect(await t.action(internal.ingestion.scheduleDailyIngestion, {})).toBe(2);
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    const runs = await t.run((ctx) => ctx.db.query('ingestionRuns').collect());
    expect(runs.map((run) => run.status)).toEqual(['succeeded', 'succeeded']);
  });
});

describe('ingestMapasCulturaisInstance', () => {
  test('records every open call notice and closes the run with its counts', async () => {
    const { t, sourceId } = await withSource();
    const fetchMock = mapasAnswers([mapasOpportunity(), mapasOpportunity({ id: 99 })]);

    expect(await t.action(internal.ingestion.ingestMapasCulturaisInstance, { sourceId })).toBe(
      'succeeded',
    );

    const asked = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(asked.origin + asked.pathname).toBe('https://mapa.cultura.gov.br/api/opportunity/find');
    expect(asked.searchParams.get('@select')).not.toContain('owner');
    expect(await t.run((ctx) => ctx.db.query('callNotices').collect())).toHaveLength(2);
    expect(await runsOf(t)).toMatchObject([
      { status: 'succeeded', callNoticesSeen: 2, callNoticesNew: 2, callNoticesRejected: 0 },
    ]);
  });

  test('a second run finds the same call notices: nothing new, still one row each', async () => {
    const { t, sourceId } = await withSource();
    mapasAnswers([mapasOpportunity()]);
    await t.action(internal.ingestion.ingestMapasCulturaisInstance, { sourceId });
    await t.action(internal.ingestion.ingestMapasCulturaisInstance, { sourceId });
    expect(await t.run((ctx) => ctx.db.query('callNotices').collect())).toHaveLength(1);
    expect((await runsOf(t))[1]).toMatchObject({ callNoticesSeen: 1, callNoticesNew: 0 });
  });

  test('counts and skips an entry the contract refuses, and records the rest', async () => {
    const { t, sourceId } = await withSource();
    mapasAnswers([
      mapasOpportunity(),
      mapasOpportunity({ id: 2, singleUrl: 'javascript:alert(1)' }),
      { id: 3 },
      mapasOpportunity({
        id: 4,
        registrationTo: { date: '2026-11-15 23:59:00.000000', timezone: 'America/Atlantis' },
      }),
    ]);
    expect(await t.action(internal.ingestion.ingestMapasCulturaisInstance, { sourceId })).toBe(
      'succeeded',
    );
    expect(await runsOf(t)).toMatchObject([
      { status: 'succeeded', callNoticesSeen: 4, callNoticesNew: 1, callNoticesRejected: 3 },
    ]);
  });

  test('an instance that answers an error fails the run and says why', async () => {
    const { t, sourceId } = await withSource();
    mapasAnswers({ error: 'down' }, 503);
    expect(await t.action(internal.ingestion.ingestMapasCulturaisInstance, { sourceId })).toBe(
      'failed',
    );
    expect(await runsOf(t)).toMatchObject([
      { status: 'failed', failureReason: 'mapa.cultura.gov.br answered HTTP 503' },
    ]);
  });

  test('an inactive source is skipped without a run', async () => {
    const { t, sourceId } = await withSource({ ...federalMapasSource, isActive: false });
    const fetchMock = mapasAnswers([]);
    expect(await t.action(internal.ingestion.ingestMapasCulturaisInstance, { sourceId })).toBe(
      'skipped',
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await runsOf(t)).toEqual([]);
  });
});

describe('the run lease', () => {
  const start = internal.ingestion.startIngestionRun;

  test('a source with a run going gets no second one', async () => {
    const { t, sourceId } = await withSource();
    expect(await t.mutation(start, { sourceId })).not.toBeNull();
    expect(await t.mutation(start, { sourceId })).toBeNull();
  });

  test('a run past the lease is closed as failed and replaced', async () => {
    const { t, sourceId } = await withSource();
    await t.run((ctx) =>
      ctx.db.insert('ingestionRuns', {
        sourceId,
        startedAt: Date.now() - ingestionRunLeaseMs - 1,
        status: 'running',
        callNoticesSeen: 0,
        callNoticesNew: 0,
        callNoticesRejected: 0,
      }),
    );
    expect(await t.mutation(start, { sourceId })).not.toBeNull();
    const runs = await runsOf(t);
    expect(runs.map((run) => run.status)).toEqual(['failed', 'running']);
  });

  test('a run already closed cannot be closed again', async () => {
    const { t, sourceId } = await withSource();
    const runId = await t.mutation(start, { sourceId });
    const counts = { callNoticesSeen: 0, callNoticesNew: 0, callNoticesRejected: 0 };
    await t.mutation(internal.ingestion.finishIngestionRun, {
      runId: runId!,
      ...counts,
    });
    await expect(
      t.mutation(internal.ingestion.finishIngestionRun, { runId: runId!, ...counts }),
    ).rejects.toThrow(/conflict/);
  });
});
