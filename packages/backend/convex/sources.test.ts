import { convexTest } from 'convex-test';
import { describe, expect, test } from 'vitest';
import { SourceSchema, type Source } from '@bratura/shared/entities/source/entity';
import { internal } from './_generated/api';
import * as registry from './model/sources/registry';
import { federalMapasSource, registeredSources } from './model/sources/registry';
import schema from './schema';
import { modules } from './test.setup';

const registerSource = internal.sources.registerSource;

describe('registeredSources', () => {
  // `satisfies Source` checks only the shape; the slug pattern, https and trimming are Zod rules.
  test.each(registeredSources.map((source) => [source.slug, source] as const))(
    '%s passes the entity unchanged',
    (_slug, source) => {
      expect(SourceSchema.parse(source)).toEqual(source);
    },
  );

  test('lists every source the registry declares', () => {
    const declared = Object.values(registry).filter((value) => value !== registeredSources);
    expect(new Set(registeredSources)).toEqual(new Set(declared));
  });

  test('no two sources share a slug', () => {
    const slugs = registeredSources.map((source) => source.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('registerSource', () => {
  test('inserts the registered source the first time', async () => {
    const t = convexTest(schema, modules);
    await t.mutation(registerSource, { slug: 'mapas-federal' });
    const stored = await t.run((ctx) => ctx.db.query('sources').collect());
    expect(stored).toMatchObject([federalMapasSource]);
  });

  test('replaces a row edited elsewhere with the registry, keeping its id', async () => {
    const t = convexTest(schema, modules);
    const sourceId = await t.mutation(registerSource, { slug: 'mapas-federal' });
    await t.run((ctx) => ctx.db.patch(sourceId, { isActive: false, name: 'Edited' }));
    expect(await t.mutation(registerSource, { slug: 'mapas-federal' })).toBe(sourceId);
    const stored = await t.run((ctx) => ctx.db.query('sources').collect());
    expect(stored).toMatchObject([federalMapasSource]);
  });

  test('refuses a slug the registry does not have', async () => {
    const t = convexTest(schema, modules);
    await expect(t.mutation(registerSource, { slug: 'mapas-unknown' })).rejects.toThrow(/notFound/);
  });

  test('rejects a slug the Convex validator alone would let through', async () => {
    const t = convexTest(schema, modules);
    await expect(t.mutation(registerSource, { slug: 'Mapas Federal' })).rejects.toThrow(
      /invalidInput/,
    );
  });
});

const newsSite: Source = {
  kind: 'newsSite',
  slug: 'news',
  name: 'News',
  isActive: true,
  robotsCheckedOn: '2026-11-13',
  termsCheckedOn: '2026-11-13',
  siteUrl: 'https://example.com.br',
};

describe('getSource', () => {
  test('gives the source as registered, without system fields', async () => {
    const t = convexTest(schema, modules);
    const sourceId = await t.mutation(registerSource, { slug: 'mapas-federal' });
    expect(await t.query(internal.sources.getSource, { sourceId })).toEqual(federalMapasSource);
  });
});

describe('listActiveSources', () => {
  test('lists only active sources, with their kind', async () => {
    const t = convexTest(schema, modules);
    const mapasId = await t.mutation(registerSource, { slug: 'mapas-federal' });
    await t.mutation(registerSource, { slug: 'mapas-pe' });
    const newsId = await t.run((ctx) => ctx.db.insert('sources', newsSite));
    expect(await t.query(internal.sources.listActiveSources, {})).toEqual([
      { sourceId: mapasId, kind: 'mapasCulturaisInstance' },
      { sourceId: newsId, kind: 'newsSite' },
    ]);
  });
});
