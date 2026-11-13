import { convexTest } from 'convex-test';
import { describe, expect, test } from 'vitest';
import { internal } from '../_generated/api';
import type { Id } from '../_generated/dataModel';
import schema from '../schema';
import { modules } from '../test.setup';
import { federalMapasSource } from './source.fixture';

const recordCallNotice = internal.ingestion.callNotices.recordCallNotice;

const inFortaleza = (at: number, precision: 'day' | 'minute') => ({
  at,
  timeZone: 'America/Fortaleza',
  precision,
});

const listing = (sourceId: Id<'sources'>) => ({
  sourceId,
  externalId: '4321',
  title: 'Edital de Difusão Cultural 2026',
  summary: null,
  officialUrl: 'https://mapa.cultura.gov.br/oportunidade/4321/',
  documentUrl: null,
  registrationOpens: inFortaleza(Date.UTC(2026, 10, 1, 3), 'day'),
  registrationCloses: inFortaleza(Date.UTC(2026, 11, 2, 2, 59), 'minute'),
});

async function withSource() {
  const t = convexTest(schema, modules);
  const sourceId = await t.mutation(internal.ingestion.sources.addSource, {
    source: federalMapasSource,
  });
  return { t, sourceId };
}

describe('recordCallNotice', () => {
  test('stores a new call notice with when it was first and last seen', async () => {
    const { t, sourceId } = await withSource();
    await t.mutation(recordCallNotice, listing(sourceId));
    const [stored] = await t.run((ctx) => ctx.db.query('callNotices').collect());
    expect(stored).toMatchObject(listing(sourceId));
    expect(stored?.firstSeenAt).toBe(stored?.lastSeenAt);
  });

  test('a call notice read again stays one row, updated in place', async () => {
    const { t, sourceId } = await withSource();
    const first = await t.mutation(recordCallNotice, listing(sourceId));
    const again = await t.mutation(recordCallNotice, {
      ...listing(sourceId),
      title: 'Edital de Difusão Cultural 2026 (retificado)',
    });
    const stored = await t.run((ctx) => ctx.db.query('callNotices').collect());
    expect(again).toBe(first);
    expect(stored).toHaveLength(1);
    expect(stored[0]?.title).toBe('Edital de Difusão Cultural 2026 (retificado)');
  });

  test('tracking comes from the server, never from the caller', async () => {
    const { t, sourceId } = await withSource();
    await expect(
      // @ts-expect-error lastSeenAt is the server's: tsc refuses it too
      t.mutation(recordCallNotice, { ...listing(sourceId), lastSeenAt: 0 }),
    ).rejects.toThrow();
  });

  // The rule across fields that convex-helpers' zCustom* builders drop: ours keeps it.
  test('rejects a registration window that closes before it opens', async () => {
    const { t, sourceId } = await withSource();
    await expect(
      t.mutation(recordCallNotice, {
        ...listing(sourceId),
        registrationOpens: inFortaleza(Date.UTC(2026, 11, 10), 'day'),
        registrationCloses: inFortaleza(Date.UTC(2026, 11, 1), 'day'),
      }),
    ).rejects.toThrow(/registrationCloses/);
  });

  test('accepts a window with an end the source did not give', async () => {
    const { t, sourceId } = await withSource();
    await t.mutation(recordCallNotice, { ...listing(sourceId), registrationOpens: null });
    expect(await t.run((ctx) => ctx.db.query('callNotices').collect())).toHaveLength(1);
  });

  test('rejects a link a creator could not open safely', async () => {
    const { t, sourceId } = await withSource();
    await expect(
      t.mutation(recordCallNotice, { ...listing(sourceId), officialUrl: 'javascript:alert(1)' }),
    ).rejects.toThrow(/invalidInput/);
  });

  test('rejects a zone the runtime does not know', async () => {
    const { t, sourceId } = await withSource();
    await expect(
      t.mutation(recordCallNotice, {
        ...listing(sourceId),
        registrationCloses: { ...inFortaleza(0, 'day'), timeZone: 'America/Atlantis' },
      }),
    ).rejects.toThrow(/unknownTimeZone/);
  });

  test('rejects an id from another table as the source', async () => {
    const { t, sourceId } = await withSource();
    const callNoticeId = await t.mutation(recordCallNotice, listing(sourceId));
    await expect(
      t.mutation(recordCallNotice, {
        ...listing(sourceId),
        // @ts-expect-error a call notice id is not a source id: tsc refuses it too
        sourceId: callNoticeId,
      }),
    ).rejects.toThrow(/sourceId|Validator|table/i);
  });
});
