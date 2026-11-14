import { convexTest } from 'convex-test';
import { ianaTimeZone } from '@bratura/shared/primitives/code/time/time-zone/fields';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { internal } from './_generated/api';
import { documentReadingLeaseMs } from './documents';
import schema from './schema';
import { federalMapasSource } from './sources.fixture';
import { modules } from './test.setup';

const day = 24 * 60 * 60 * 1000;
const in9Days = () => ({
  at: Date.now() + 9 * day,
  timeZone: ianaTimeZone.parse('America/Fortaleza'),
  precision: 'minute' as const,
});

const documentBase = 'https://mapacultural.secult.ce.gov.br/files/opportunity/8498';
const mainNotice = `${documentBase}/edital-das-artes.pdf`;
const categories = `${documentBase}/anexo-i-categorias.pdf`;

type CallNoticeOptions = {
  documentUrls?: string[];
  externalId?: string;
  registrationCloses?: ReturnType<typeof in9Days> | null;
};

async function addCallNotice(
  t: ReturnType<typeof convexTest>,
  {
    documentUrls = [mainNotice, categories, `${documentBase}/resultado-final.pdf`],
    externalId = '8498',
    registrationCloses = in9Days(),
  }: CallNoticeOptions = {},
) {
  const sourceId =
    (await t.run((ctx) => ctx.db.query('sources').first()))?._id ??
    (await t.mutation(internal.sources.addSource, { source: federalMapasSource }));
  const { callNoticeId } = await t.mutation(internal.callNotices.recordCallNotice, {
    sourceId,
    externalId,
    title: `Edital ${externalId}`,
    summary: null,
    officialUrl: `https://mapacultural.secult.ce.gov.br/oportunidade/${externalId}/`,
    documentUrls,
    registrationOpens: null,
    registrationCloses,
  });
  return callNoticeId;
}

async function withCallNotice(documentUrls?: string[]) {
  const t = convexTest(schema, modules);
  const callNoticeId = await addCallNotice(t, documentUrls ? { documentUrls } : {});
  return { t, callNoticeId };
}

const documentsOf = (t: ReturnType<typeof convexTest>) =>
  t.run((ctx) => ctx.db.query('callNoticeDocuments').collect());

function firecrawlAnswersPerUrl(answer: (url: string) => Response) {
  const fetchMock = vi.fn<typeof fetch>(async (_input, init) =>
    answer(String(JSON.parse(String(init?.body)).url)),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const scraped = (markdown: string, creditsUsed: number) =>
  new Response(JSON.stringify({ success: true, data: { markdown, metadata: { creditsUsed } } }));

const readPending = (t: ReturnType<typeof convexTest>, creditCeiling = 100) =>
  t.action(internal.documents.readPendingDocuments, { creditCeiling });

describe('readPendingDocuments', () => {
  beforeEach(() => {
    vi.stubEnv('FIRECRAWL_API_KEY', 'fc-key');
    vi.stubGlobal('setTimeout', (resolve: () => void) => resolve());
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  test('reads the call notice and its categories, never the result, and stores them once', async () => {
    const { t } = await withCallNotice();
    const fetchMock = firecrawlAnswersPerUrl((url) => scraped(`# ${url}`, 14));

    expect(await readPending(t)).toEqual({
      read: 2,
      failed: 0,
      creditsUsed: 28,
      left: 0,
      stoppedBy: 'nothingLeft',
    });
    const stored = await documentsOf(t);
    expect(stored.map(({ url, role, status }) => ({ url, role, status }))).toEqual([
      { url: mainNotice, role: 'callNotice', status: 'read' },
      { url: categories, role: 'categories', status: 'read' },
    ]);
    expect(stored[0]).toMatchObject({ markdown: `# ${mainNotice}`, creditsUsed: 14 });

    expect(await readPending(t)).toMatchObject({ read: 0, left: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('reads nothing of a call whose notice no file name identifies', async () => {
    const { t } = await withCallNotice([categories, `${documentBase}/anexo-2-criterios.pdf`]);
    const fetchMock = firecrawlAnswersPerUrl(() => scraped('# Anexo', 2));
    expect(await readPending(t)).toMatchObject({ read: 0, left: 0, stoppedBy: 'nothingLeft' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('reads the calls closing soonest first, then those with no close date', async () => {
    const t = convexTest(schema, modules);
    const urlOf = (id: string) =>
      `https://mapacultural.secult.ce.gov.br/files/opportunity/${id}/edital.pdf`;
    for (const [externalId, registrationCloses] of [
      ['later', { ...in9Days(), at: Date.now() + 30 * day }],
      ['undated', null],
      ['sooner', in9Days()],
      ['noDeadline', { ...in9Days(), at: Date.UTC(2111, 0, 1) }],
    ] as const) {
      await addCallNotice(t, { externalId, registrationCloses, documentUrls: [urlOf(externalId)] });
    }
    const pending = await t.query(internal.documents.listDocumentsToRead, {});
    expect(pending.map(({ url }) => url)).toEqual([
      urlOf('sooner'),
      urlOf('later'),
      urlOf('undated'),
    ]);
  });

  test('stops at the credit ceiling and leaves the rest for the next run', async () => {
    const { t } = await withCallNotice();
    firecrawlAnswersPerUrl(() => scraped('# Edital', 30));
    expect(await readPending(t, 20)).toEqual({
      read: 1,
      failed: 0,
      creditsUsed: 30,
      left: 1,
      stoppedBy: 'creditCeiling',
    });
  });

  test('out of credits stops the run; the document is tried again by the next one', async () => {
    const { t } = await withCallNotice([mainNotice]);
    firecrawlAnswersPerUrl(() => new Response('{}', { status: 402 }));
    expect(await readPending(t)).toMatchObject({ read: 0, stoppedBy: 'outOfCredits' });
    expect(await documentsOf(t)).toMatchObject([{ status: 'failed', failure: 'outOfCredits' }]);

    firecrawlAnswersPerUrl(() => scraped('# Edital', 3));
    expect(await readPending(t)).toMatchObject({ read: 1 });
  });

  test('an answer without its cost stops the run: the ceiling could not hold', async () => {
    const { t } = await withCallNotice();
    const fetchMock = firecrawlAnswersPerUrl(
      () => new Response(JSON.stringify({ success: true, data: { markdown: '# Edital' } })),
    );
    expect(await readPending(t)).toMatchObject({ read: 1, left: 1, stoppedBy: 'unknownCost' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('a rate-limited read waits and retries once', async () => {
    const { t } = await withCallNotice([mainNotice]);
    let calls = 0;
    firecrawlAnswersPerUrl(() =>
      (calls += 1) === 1 ? new Response('{}', { status: 429 }) : scraped('# Edital', 6),
    );
    expect(await readPending(t)).toMatchObject({ read: 1, creditsUsed: 6 });
  });

  test("a provider error is stored as a code, never the provider's text", async () => {
    const { t } = await withCallNotice([mainNotice]);
    firecrawlAnswersPerUrl(() => new Response('internal detail of the provider', { status: 500 }));
    expect(await readPending(t)).toMatchObject({ failed: 1 });
    const [stored] = await documentsOf(t);
    expect(stored).toMatchObject({ status: 'failed', failure: 'providerError' });
    expect(JSON.stringify(stored)).not.toContain('internal detail');
  });

  test('a document with no text is paid once: it is not read again, it waits for review', async () => {
    const { t } = await withCallNotice([mainNotice]);
    const fetchMock = firecrawlAnswersPerUrl(() => scraped('  ', 3));
    expect(await readPending(t)).toMatchObject({ read: 0, failed: 1, creditsUsed: 3 });
    expect(await documentsOf(t)).toMatchObject([
      { status: 'failed', failure: 'noText', creditsUsed: 3 },
    ]);

    expect(await readPending(t)).toMatchObject({ read: 0, failed: 0, left: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('a document another run reserved is not paid twice, until its reservation is stale', async () => {
    const { t, callNoticeId } = await withCallNotice([mainNotice]);
    const document = { callNoticeId, url: mainNotice, role: 'callNotice' as const };
    expect(await t.mutation(internal.documents.reserveDocumentRead, document)).toBe(true);
    expect(await t.mutation(internal.documents.reserveDocumentRead, document)).toBe(false);
    expect(await t.query(internal.documents.listDocumentsToRead, {})).toEqual([]);

    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + documentReadingLeaseMs);
    expect(await t.mutation(internal.documents.reserveDocumentRead, document)).toBe(true);
  });
});
