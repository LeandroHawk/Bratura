import { convexTest } from 'convex-test';
import { describe, expect, test } from 'vitest';
import type { Source } from '@bratura/shared/entities/source/entity';
import { internal } from '../_generated/api';
import schema from '../schema';
import { modules } from '../test.setup';
import { federalMapasSource } from './source.fixture';

const addSource = internal.ingestion.sources.addSource;

// The Convex validator derived by zodToConvex is only a shape (`slug: v.string()`). These tests
// prove the builder still runs the entity's field rules (docs/contracts.md §3).
describe('addSource', () => {
  test('stores a source the Zod entity accepts', async () => {
    const t = convexTest(schema, modules);
    await t.mutation(addSource, { source: federalMapasSource });
    const stored = await t.run((ctx) => ctx.db.query('sources').collect());
    expect(stored).toMatchObject([federalMapasSource]);
  });

  test('stores each kind with its own fields', async () => {
    const t = convexTest(schema, modules);
    const spCityPage: Source = {
      kind: 'officialPage',
      slug: 'sp-cidade-cultura',
      name: 'Prefeitura de São Paulo — editais de cultura',
      isActive: true,
      robotsCheckedOn: '2026-11-07',
      termsCheckedOn: '2026-11-07',
      listingUrl: 'https://prefeitura.sp.gov.br/web/cultura/editais/',
      callUrlPatterns: ['/edital', '.pdf'],
    };
    await t.mutation(addSource, { source: spCityPage });
    const [stored] = await t.run((ctx) => ctx.db.query('sources').collect());
    expect(stored).toMatchObject(spCityPage);
  });

  test('rejects a slug the Convex validator alone would let through', async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(addSource, { source: { ...federalMapasSource, slug: 'Mapas Federal' } }),
    ).rejects.toThrow(/invalidInput/);
  });

  test('rejects a plain-http url, a refinement of z.url', async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(addSource, {
        source: { ...federalMapasSource, baseUrl: 'http://mapa.cultura.gov.br' },
      }),
    ).rejects.toThrow(/invalidInput/);
  });

  test('rejects fields of another kind', async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(addSource, {
        // @ts-expect-error a Mapas instance has no listing URL: tsc refuses it too
        source: { ...federalMapasSource, listingUrl: 'https://mapa.cultura.gov.br/editais' },
      }),
    ).rejects.toThrow();
  });

  test('trims text before storing, a Zod overwrite the Convex validator cannot express', async () => {
    const t = convexTest(schema, modules);
    await t.mutation(addSource, { source: { ...federalMapasSource, name: '  Federal  ' } });
    const stored = await t.run((ctx) => ctx.db.query('sources').first());
    expect(stored?.name).toBe('Federal');
  });

  test('refuses a second source with the same slug', async () => {
    const t = convexTest(schema, modules);
    await t.mutation(addSource, { source: federalMapasSource });
    await expect(t.mutation(addSource, { source: federalMapasSource })).rejects.toThrow(/conflict/);
  });
});
