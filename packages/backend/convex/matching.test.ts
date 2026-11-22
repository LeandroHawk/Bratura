import { CULTURAL_QA_PROFILES } from '@bratura/shared/entities/creator/demo/five-cultural-profiles.fixture';
import {
  matchProfileFromPortfolio,
  MatchProfileSchema,
} from '@bratura/shared/entities/match/profile';
import { portfolioItemsMax } from '@bratura/shared/entities/portfolio-item/entity';
import { callNoticeCardsPageMax } from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-cards/query';
import { callNoticeHighlightsCount } from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-highlights/query';
import type { CallNoticeExtraction } from '@bratura/shared/entities/call-notice-extraction/entity';
import { ianaTimeZone } from '@bratura/shared/primitives/code/time/time-zone/fields';
import { convexTest } from 'convex-test';
import { ConvexError } from 'convex/values';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { api, internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { callNoticeCardsRowsReadMax } from './matching';
import { federalMapasSource } from './model/sources/registry';
import schema from './schema';
import { modules } from './test.setup';

const NOW = Date.UTC(2026, 10, 15, 15);
const dayInMs = 24 * 60 * 60 * 1000;
const minutesInADay = 24 * 60;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
});
afterEach(() => {
  vi.useRealTimers();
});

type TestBackend = ReturnType<typeof convexTest>;
type Extracted = Omit<CallNoticeExtraction, 'callNoticeId' | 'extractedAt'>;

const extracted = (overrides: Partial<Extracted> = {}): Extracted => ({
  documentHashes: ['a'.repeat(64)],
  promptVersion: 4,
  model: 'test-model',
  valuesRefused: 0,
  isCreatorCall: { value: true, quote: 'chamamento de projetos culturais' },
  amountsPerProject: [],
  totalBudget: null,
  applicantTypes: { value: ['individual'], quote: 'pessoas físicas' },
  residenceRequirement: null,
  artForms: [{ value: 'crafts', quote: 'artesanato' }],
  requirements: [],
  eligibilityRules: [],
  quotas: [],
  evaluationCriteria: [],
  registrationCloses: null,
  ...overrides,
});

const amount = (amountInCents: number) => ({
  category: 'categoria',
  amountInCents,
  quote: 'valor por projeto',
});
const missingPaperToApply = {
  kind: 'cnpjOrMei' as const,
  detail: 'CNPJ',
  appliesTo: null,
  stage: 'registration' as const,
  quote: 'cartão do CNPJ',
};

let callNumber = 0;

/** A call of the federal Mapas source, its extraction when given, and its match computed. */
async function withCall(
  t: TestBackend,
  {
    title = 'Edital',
    closesInDays,
    firstSeenDaysAgo = 30,
    extraction = extracted(),
    resultPosted,
  }: {
    title?: string;
    closesInDays: number | null;
    resultPosted?: boolean;
    firstSeenDaysAgo?: number;
    extraction?: Extracted | null;
  },
): Promise<Id<'callNotices'>> {
  callNumber += 1;
  const externalId = `opp-${callNumber}`;
  const callNoticeId = await t.run(async (ctx) => {
    const source =
      (await ctx.db.query('sources').first()) ??
      (await ctx.db.get(await ctx.db.insert('sources', federalMapasSource)));
    if (!source) throw new Error('no source');
    const id = await ctx.db.insert('callNotices', {
      sourceId: source._id,
      externalId,
      title,
      summary: null,
      officialUrl: `https://mapa.cultura.gov.br/oportunidade/${callNumber}/`,
      documentUrls: [],
      registrationOpens: null,
      registrationCloses:
        closesInDays === null
          ? null
          : {
              at: NOW + closesInDays * dayInMs,
              timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
              precision: 'minute',
            },
      firstSeenAt: NOW - firstSeenDaysAgo * dayInMs,
      lastSeenAt: NOW,
      closedWhenFirstSeen: false,
      ...(resultPosted === undefined ? {} : { resultPosted }),
    });
    if (extraction)
      await ctx.db.insert('callNoticeExtractions', {
        ...extraction,
        callNoticeId: id,
        extractedAt: NOW - dayInMs,
      });
    return id;
  });
  await t.mutation(internal.matching.recomputeMatchOfCallNotice, { callNoticeId });
  return callNoticeId;
}

const firstPage = { numItems: callNoticeCardsPageMax, cursor: null };
const everyOpenCall = {
  classification: null,
  closes: 'stillOpen' as const,
  sort: 'closestDeadline' as const,
  paginationOpts: firstPage,
};

async function titlesOf(t: TestBackend, args: Partial<typeof everyOpenCall> | object = {}) {
  const { page } = await t.query(api.matching.callNoticeCards, { ...everyOpenCall, ...args });
  return page.map(({ title }) => title);
}

describe('publicZodQuery', () => {
  test('is callable with no caller, and parses its args with the whole Zod schema', async () => {
    const t = convexTest(schema, modules);
    await expect(t.query(api.matching.callNoticeCards, everyOpenCall)).resolves.toMatchObject({
      page: [],
      isDone: true,
    });
    const overTheCeiling = t.query(api.matching.callNoticeCards, {
      ...everyOpenCall,
      paginationOpts: { numItems: callNoticeCardsPageMax + 1, cursor: null },
    });
    await expect(overTheCeiling).rejects.toBeInstanceOf(ConvexError);
    await expect(overTheCeiling).rejects.toMatchObject({ data: { code: 'invalidInput' } });
  });

  test('its returns schema keeps a stored field out of the answer', async () => {
    const t = convexTest(schema, modules);
    await withCall(t, { closesInDays: 5 });
    const [highlight] = await t.query(api.matching.callNoticeHighlights, {});
    expect(highlight).not.toHaveProperty('classification');
    expect(highlight).not.toHaveProperty('externalId');
  });
});

describe('recomputeMatchOfCallNotice', () => {
  test('stores one match per call for creators, replaced on a new run', async () => {
    const t = convexTest(schema, modules);
    const callNoticeId = await withCall(t, { closesInDays: 5 });
    await t.mutation(internal.matching.recomputeMatchOfCallNotice, { callNoticeId });
    const matches = await t.run((ctx) => ctx.db.query('matches').collect());
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ callNoticeId, classification: 'eligible' });
  });

  test('a call that is not for creators, or has no extraction, has no match', async () => {
    const t = convexTest(schema, modules);
    await withCall(t, {
      closesInDays: 5,
      extraction: extracted({ isCreatorCall: { value: false, quote: 'seleção de pareceristas' } }),
    });
    await withCall(t, { closesInDays: 5, extraction: extracted({ isCreatorCall: null }) });
    await withCall(t, { closesInDays: 5, extraction: null });
    expect(await t.run((ctx) => ctx.db.query('matches').collect())).toEqual([]);
    expect(await titlesOf(t)).toEqual([]);
  });

  test('an extraction that turns a call into noise removes its match', async () => {
    const t = convexTest(schema, modules);
    const callNoticeId = await withCall(t, { closesInDays: 5 });
    await t.run(async (ctx) => {
      const extraction = await ctx.db.query('callNoticeExtractions').first();
      if (extraction)
        await ctx.db.patch(extraction._id, { isCreatorCall: { value: false, quote: 'cadastro' } });
    });
    await t.mutation(internal.matching.recomputeMatchOfCallNotice, { callNoticeId });
    expect(await t.run((ctx) => ctx.db.query('matches').collect())).toEqual([]);
  });

  test('recordExtraction schedules the match of its call', async () => {
    vi.useFakeTimers({ now: NOW });
    const t = convexTest(schema, modules);
    const callNoticeId = await withCall(t, { closesInDays: 5, extraction: null });
    await t.mutation(internal.extraction.recordExtraction, { ...extracted(), callNoticeId });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(await t.run((ctx) => ctx.db.query('matches').collect())).toHaveLength(1);
  });
});

describe('recomputeMatches', () => {
  test('matches every extraction, a batch per run, until done', async () => {
    vi.useFakeTimers({ now: NOW });
    const t = convexTest(schema, modules);
    for (let index = 0; index < 3; index += 1) await withCall(t, { closesInDays: 5 + index });
    await t.run(async (ctx) => {
      for (const match of await ctx.db.query('matches').collect()) await ctx.db.delete(match._id);
    });
    await t.mutation(internal.matching.recomputeMatches, { cursor: null });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(await t.run((ctx) => ctx.db.query('matches').collect())).toHaveLength(3);
  });
});

describe('callNoticeCards', () => {
  test.each(['closestDeadline', 'largestAmount', 'newest'] as const)(
    'a closed call is listed as not eligible alone, whatever fit is stored (%s)',
    async (sort) => {
      const t = convexTest(schema, modules);
      await withCall(t, { title: 'fechou ontem', closesInDays: -1 });
      await withCall(t, { title: 'fecha amanhã', closesInDays: 1 });
      const closed = { closes: 'closed' as const, sort };
      expect(await titlesOf(t, { ...closed, classification: 'eligible' })).toEqual([]);
      expect(await titlesOf(t, { ...closed, classification: 'almostEligible' })).toEqual([]);
      expect(await titlesOf(t, { ...closed, classification: 'notEligible' })).toEqual([
        'fechou ontem',
      ]);
    },
  );

  test.each([
    ['no close', null],
    ['a close still ahead', 5],
  ])('a call whose result is posted is closed, with %s', async (_close, closesInDays) => {
    const t = convexTest(schema, modules);
    const callNoticeId = await withCall(t, {
      title: 'resultado publicado',
      closesInDays,
      resultPosted: true,
    });
    await withCall(t, { title: 'fechou ontem', closesInDays: -1 });
    expect(await titlesOf(t)).toEqual([]);
    expect(await titlesOf(t, { closes: 'closed' })).toEqual([
      'fechou ontem',
      'resultado publicado',
    ]);
    const { page } = await t.query(api.matching.callNoticeCards, {
      ...everyOpenCall,
      closes: 'closed',
    });
    expect(page[1]).toMatchObject({
      deadline: 'closed',
      closesSoon: false,
      classification: 'notEligible',
    });
    expect(await t.query(api.matching.callNoticeDetails, { callNoticeId })).toMatchObject({
      deadline: 'closed',
      classification: 'notEligible',
    });
    expect(await t.query(api.matching.callNoticeCounters, {})).toMatchObject({ open: 0 });
    expect(await t.query(api.matching.callNoticeHighlights, {})).toEqual([]);
  });

  test('a result the source posts later closes the call in the lists at once', async () => {
    vi.useFakeTimers({ now: NOW });
    const t = convexTest(schema, modules);
    const callNoticeId = await withCall(t, { title: 'sem prazo', closesInDays: null });
    expect(await titlesOf(t)).toEqual(['sem prazo']);
    const listed = await t.run(async (ctx) => {
      const callNotice = await ctx.db.get(callNoticeId);
      if (!callNotice) throw new Error('no call');
      const { sourceId, externalId, title, summary, officialUrl, documentUrls } = callNotice;
      const { registrationOpens, registrationCloses } = callNotice;
      return {
        ...{ sourceId, externalId, title, summary, officialUrl, documentUrls },
        ...{ registrationOpens, registrationCloses },
      };
    });
    await t.mutation(internal.callNotices.recordCallNotice, { ...listed, resultPosted: true });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(await titlesOf(t)).toEqual([]);
    expect(await titlesOf(t, { closes: 'closed' })).toEqual(['sem prazo']);
    expect(await t.query(api.matching.callNoticeCounters, {})).toMatchObject({ open: 0 });
  });

  test('a page stops at the rows it may read: the filter never walks the whole table', async () => {
    const t = convexTest(schema, modules);
    await withCall(t, { title: 'aberto', closesInDays: 1, firstSeenDaysAgo: 40 });
    const closedId = await withCall(t, { title: 'fechado', closesInDays: -1 });
    await t.run(async (ctx) => {
      const closed = await ctx.db
        .query('matches')
        .withIndex('by_call_notice', (index) => index.eq('callNoticeId', closedId))
        .unique();
      if (!closed) throw new Error('no match');
      const row = {
        callNoticeId: closed.callNoticeId,
        classification: closed.classification,
        closesAtForOrdering: closed.closesAtForOrdering,
        largestAmountPerProjectInCents: closed.largestAmountPerProjectInCents,
        callNoticeFirstSeenAt: closed.callNoticeFirstSeenAt,
        computedAt: closed.computedAt,
      };
      for (let copy = 1; copy < callNoticeCardsRowsReadMax; copy += 1)
        await ctx.db.insert('matches', row);
    });
    const newestOpen = { ...everyOpenCall, sort: 'newest' as const };
    const first = await t.query(api.matching.callNoticeCards, newestOpen);
    expect(first).toMatchObject({ page: [], isDone: false });
    const second = await t.query(api.matching.callNoticeCards, {
      ...newestOpen,
      paginationOpts: { ...firstPage, cursor: first.continueCursor },
    });
    expect(second.page.map(({ title }) => title)).toEqual(['aberto']);
  });

  test('a card carries the organizer from the source, the deadline on the server clock and the fit', async () => {
    const t = convexTest(schema, modules);
    await withCall(t, {
      title: 'Edital de Artesanato',
      closesInDays: 3,
      extraction: extracted({
        amountsPerProject: [amount(500_000), amount(2_000_000)],
        totalBudget: { amountInCents: 90_000_000, quote: 'valor total do edital' },
      }),
    });
    const { page } = await t.query(api.matching.callNoticeCards, everyOpenCall);
    expect(page).toHaveLength(1);
    expect(page[0]).toMatchObject({
      title: 'Edital de Artesanato',
      organizer: federalMapasSource.name,
      deadline: 'open',
      closesSoon: true,
      isNew: false,
      largestAmountPerProjectInCents: 2_000_000,
      artForms: ['crafts'],
      classification: 'eligible',
    });
  });

  test('still open: closing first, the calls with no close last, the closed ones out', async () => {
    const t = convexTest(schema, modules);
    await withCall(t, { title: 'fecha em 20', closesInDays: 20 });
    await withCall(t, { title: 'sem prazo', closesInDays: null });
    await withCall(t, { title: 'fechado', closesInDays: -2 });
    await withCall(t, { title: 'fecha em 3', closesInDays: 3 });
    expect(await titlesOf(t)).toEqual(['fecha em 3', 'fecha em 20', 'sem prazo']);
  });

  test('the deadline windows are answered by the server', async () => {
    const t = convexTest(schema, modules);
    await withCall(t, { title: 'fecha em 3', closesInDays: 3 });
    await withCall(t, { title: 'fecha em 20', closesInDays: 20 });
    await withCall(t, { title: 'fecha em 60', closesInDays: 60 });
    await withCall(t, { title: 'fechou ontem', closesInDays: -1 });
    await withCall(t, { title: 'fechou há 9 dias', closesInDays: -9 });
    expect(await titlesOf(t, { closes: 'within7Days' })).toEqual(['fecha em 3']);
    expect(await titlesOf(t, { closes: 'within30Days' })).toEqual(['fecha em 3', 'fecha em 20']);
    expect(await titlesOf(t, { closes: 'closed' })).toEqual(['fechou ontem', 'fechou há 9 dias']);
  });

  test('the classification is one index range, and a closed call is never eligible', async () => {
    const t = convexTest(schema, modules);
    await withCall(t, { title: 'pode', closesInDays: 5 });
    await withCall(t, {
      title: 'quase',
      closesInDays: 6,
      extraction: extracted({ requirements: [missingPaperToApply] }),
    });
    await withCall(t, { title: 'podia, fechou', closesInDays: -1 });
    expect(await titlesOf(t, { classification: 'eligible' })).toEqual(['pode']);
    expect(await titlesOf(t, { classification: 'almostEligible' })).toEqual(['quase']);
    const closed = await t.query(api.matching.callNoticeCards, {
      ...everyOpenCall,
      closes: 'closed',
    });
    expect(closed.page.map(({ classification }) => classification)).toEqual(['notEligible']);
  });

  test('largest amount sorts by one project amount, never by the call total', async () => {
    const t = convexTest(schema, modules);
    await withCall(t, {
      title: 'R$ 5 mil por projeto, R$ 9 milhões no total',
      closesInDays: 5,
      extraction: extracted({
        amountsPerProject: [amount(500_000)],
        totalBudget: { amountInCents: 900_000_000, quote: 'total' },
      }),
    });
    await withCall(t, {
      title: 'R$ 20 mil por projeto',
      closesInDays: 9,
      extraction: extracted({ amountsPerProject: [amount(2_000_000)] }),
    });
    await withCall(t, {
      title: 'só o total',
      closesInDays: 7,
      extraction: extracted({ totalBudget: { amountInCents: 999_000_000, quote: 'total' } }),
    });
    expect(await titlesOf(t, { sort: 'largestAmount' })).toEqual([
      'R$ 20 mil por projeto',
      'R$ 5 mil por projeto, R$ 9 milhões no total',
      'só o total',
    ]);
  });

  test('newest sorts by when the call was first seen and keeps the close filter', async () => {
    const t = convexTest(schema, modules);
    await withCall(t, { title: 'visto há 9 dias', closesInDays: 5, firstSeenDaysAgo: 9 });
    await withCall(t, { title: 'visto ontem', closesInDays: 20, firstSeenDaysAgo: 1 });
    await withCall(t, { title: 'visto hoje, fechado', closesInDays: -1, firstSeenDaysAgo: 0 });
    expect(await titlesOf(t, { sort: 'newest' })).toEqual(['visto ontem', 'visto há 9 dias']);
  });

  test('a list comes a page at a time', async () => {
    const t = convexTest(schema, modules);
    for (let index = 1; index <= 3; index += 1)
      await withCall(t, { title: `edital ${index}`, closesInDays: index });
    const first = await t.query(api.matching.callNoticeCards, {
      ...everyOpenCall,
      paginationOpts: { numItems: 2, cursor: null },
    });
    expect(first.page.map(({ title }) => title)).toEqual(['edital 1', 'edital 2']);
    expect(first.isDone).toBe(false);
    const second = await t.query(api.matching.callNoticeCards, {
      ...everyOpenCall,
      paginationOpts: { numItems: 2, cursor: first.continueCursor },
    });
    expect(second.page.map(({ title }) => title)).toEqual(['edital 3']);
  });

  test('a call that closes between two pages leaves the next page', async () => {
    const t = convexTest(schema, modules);
    await withCall(t, { title: 'fecha em 15 minutos', closesInDays: 15 / minutesInADay });
    await withCall(t, { title: 'fecha em 30 minutos', closesInDays: 30 / minutesInADay });
    const first = await t.query(api.matching.callNoticeCards, {
      ...everyOpenCall,
      paginationOpts: { numItems: 1, cursor: null },
    });
    vi.setSystemTime(NOW + (31 / minutesInADay) * dayInMs);
    const second = await t.query(api.matching.callNoticeCards, {
      ...everyOpenCall,
      paginationOpts: { numItems: 1, cursor: first.continueCursor },
    });
    expect(second.page).toEqual([]);
  });
});

describe('callNoticeHighlights', () => {
  test('a fixed few open calls closing first, with no fit', async () => {
    const t = convexTest(schema, modules);
    await withCall(t, { title: 'fechado', closesInDays: -1 });
    await withCall(t, { title: 'sem prazo', closesInDays: null });
    for (let index = 1; index <= callNoticeHighlightsCount + 2; index += 1)
      await withCall(t, { title: `fecha em ${index}`, closesInDays: index });
    const highlights = await t.query(api.matching.callNoticeHighlights, {});
    expect(highlights.map(({ title }) => title)).toEqual([
      'fecha em 1',
      'fecha em 2',
      'fecha em 3',
    ]);
    expect(highlights).toHaveLength(callNoticeHighlightsCount);
  });
});

describe('callNoticeCounters', () => {
  test('counts through the indexes: open, closing soon, new, and the fit of what is not closed', async () => {
    const t = convexTest(schema, modules);
    await withCall(t, { closesInDays: 3, firstSeenDaysAgo: 2 });
    await withCall(t, { closesInDays: 20 });
    await withCall(t, {
      closesInDays: null,
      extraction: extracted({ requirements: [missingPaperToApply] }),
    });
    await withCall(t, { closesInDays: -4 });
    expect(await t.query(api.matching.callNoticeCounters, {})).toEqual({
      open: 3,
      closingSoon: 1,
      isNew: 1,
      byClassification: { eligible: 2, almostEligible: 1, notEligible: 0 },
    });
  });
});

describe('savedCallNoticeCards', () => {
  test('the cards of the given calls, in the order given; a call with no match is left out', async () => {
    const t = convexTest(schema, modules);
    const later = await withCall(t, { title: 'fecha em 20', closesInDays: 20 });
    const sooner = await withCall(t, { title: 'fecha em 3', closesInDays: 3 });
    const unread = await withCall(t, { title: 'não lido', closesInDays: 3, extraction: null });
    const cards = await t.query(api.matching.savedCallNoticeCards, {
      callNoticeIds: [later, unread, sooner],
    });
    expect(cards.map(({ title }) => title)).toEqual(['fecha em 20', 'fecha em 3']);
  });
});

describe('callNoticeDetails', () => {
  test('everything the details show, each item with its quote and how it stands', async () => {
    const t = convexTest(schema, modules);
    const callNoticeId = await withCall(t, {
      closesInDays: 10,
      extraction: extracted({
        amountsPerProject: [amount(500_000)],
        totalBudget: { amountInCents: 90_000_000, quote: 'valor total do edital' },
        requirements: [
          {
            kind: 'identity',
            detail: 'RG ou CNH',
            appliesTo: null,
            stage: 'registration',
            quote: 'documento de identidade',
          },
          { ...missingPaperToApply, stage: 'afterSelection' },
          {
            kind: 'organizationRecords',
            detail: 'estatuto',
            appliesTo: ['nonprofit'],
            stage: 'registration',
            quote: 'estatuto social',
          },
        ],
        eligibilityRules: [
          { kind: 'minimumAge', detail: 'ter 18 anos', quote: 'maiores de 18 anos' },
        ],
        quotas: [{ group: 'black', share: '20%', quote: '20% das vagas para pessoas negras' }],
      }),
    });
    const details = await t.query(api.matching.callNoticeDetails, { callNoticeId });
    expect(details).toMatchObject({
      organizer: federalMapasSource.name,
      deadline: 'open',
      largestAmountPerProjectInCents: 500_000,
      classification: 'eligible',
      extraction: {
        totalBudget: { amountInCents: 90_000_000 },
        quotas: [{ group: 'black', share: '20%', quote: '20% das vagas para pessoas negras' }],
      },
      matchChecks: {
        applicantType: { status: 'met', quote: 'pessoas físicas' },
        requirements: [
          {
            kind: 'identity',
            stage: 'registration',
            status: 'needsConfirmation',
            quote: 'documento de identidade',
          },
          { kind: 'cnpjOrMei', stage: 'afterSelection', status: 'notMet', quote: 'cartão do CNPJ' },
        ],
        eligibilityRules: [{ kind: 'minimumAge', status: 'met', quote: 'maiores de 18 anos' }],
      },
    });
    expect(details.matchChecks?.requirements).toHaveLength(2);
    expect(details.extraction).not.toHaveProperty('documentHashes');
  });

  test('a call whose documents were not read comes with its official link and no extraction', async () => {
    const t = convexTest(schema, modules);
    const callNoticeId = await withCall(t, { closesInDays: 10, extraction: null });
    const details = await t.query(api.matching.callNoticeDetails, { callNoticeId });
    expect(details).toMatchObject({ extraction: null, classification: null, matchChecks: null });
    expect(details.officialUrl).toMatch(/^https:\/\/mapa\.cultura\.gov\.br\//);
  });

  test('a closed call is never eligible in its details either', async () => {
    const t = convexTest(schema, modules);
    const callNoticeId = await withCall(t, { closesInDays: -1 });
    const details = await t.query(api.matching.callNoticeDetails, { callNoticeId });
    expect(details).toMatchObject({ deadline: 'closed', classification: 'notEligible' });
  });

  test('an id of no call is notFound', async () => {
    const t = convexTest(schema, modules);
    const callNoticeId = await withCall(t, { closesInDays: 1 });
    await t.run(async (ctx) => {
      await ctx.db.delete(callNoticeId);
    });
    await expect(t.query(api.matching.callNoticeDetails, { callNoticeId })).rejects.toMatchObject({
      data: { code: 'notFound' },
    });
  });
});

describe('QA integration: five cultural profiles', () => {
  test.each(CULTURAL_QA_PROFILES)(
    '$key: details use the supplied profile and react to portfolio changes',
    async ({ creator, portfolioItems, years }) => {
      const t = convexTest(schema, modules);
      const callNoticeId = await withCall(t, {
        closesInDays: 20,
        extraction: extracted({
          applicantTypes: { value: [creator.applicantType], quote: 'tipo de proponente fictício' },
          artForms: [
            {
              value: creator.mainCulturalArea === 'other' ? 'any' : creator.mainCulturalArea!,
              quote: 'área cultural fictícia',
            },
          ],
          residenceRequirement: { value: 'Ceará', quote: 'Residentes no Ceará' },
          requirements: [
            { ...missingPaperToApply, kind: 'bankAccount' },
            { ...missingPaperToApply, kind: 'portfolioOrActivityProof' },
          ],
          eligibilityRules:
            years === null
              ? []
              : [
                  {
                    kind: 'minimumExperience',
                    detail: `atuação de ${years} anos`,
                    quote: `comprovar ${years} anos`,
                  },
                ],
        }),
      });
      const profile = matchProfileFromPortfolio(creator, portfolioItems);
      const before = await t.query(api.matching.callNoticeDetails, { callNoticeId, profile });
      expect(before.classification).toBe('almostEligible');
      expect(
        before.matchChecks?.requirements.find((r) => r.kind === 'portfolioOrActivityProof')?.status,
      ).toBe('met');
      profile.portfolioItems.push({
        kind: 'document',
        documentKind: 'bankAccount',
        validUntil: null,
        hasFile: true,
      });
      const after = await t.query(api.matching.callNoticeDetails, { callNoticeId, profile });
      expect(after.classification).toBe('eligible');
      expect(after.matchChecks?.requirements.find((r) => r.kind === 'bankAccount')?.status).toBe(
        'met',
      );
      const incompatible = {
        ...profile,
        creator: {
          ...profile.creator,
          state: 'SP' as const,
          city: 'Santos',
          mainCulturalArea: 'audiovisual' as const,
        },
      };
      expect(
        (await t.query(api.matching.callNoticeDetails, { callNoticeId, profile: incompatible }))
          .classification,
      ).toBe('almostEligible');
      expect(
        (
          await t.query(api.matching.callNoticeDetails, {
            callNoticeId,
            profile: { ...profile, creator: { ...profile.creator, isPublicServant: null } },
          })
        ).matchChecks,
      ).not.toBeNull();
    },
  );

  test('the public profile strips private content and bounds its items', () => {
    const { creator, portfolioItems } = CULTURAL_QA_PROFILES[0]!;
    const profile = matchProfileFromPortfolio(creator, portfolioItems);
    expect(JSON.stringify(profile)).not.toContain(creator.email);
    expect(JSON.stringify(profile)).not.toContain(creator.fullName!);
    expect(JSON.stringify(profile)).not.toContain('https://');
    expect(
      MatchProfileSchema.safeParse({
        ...profile,
        portfolioItems: Array.from(
          { length: portfolioItemsMax + 1 },
          () => profile.portfolioItems[0],
        ),
      }).success,
    ).toBe(false);
  });

  test('the open counter and classification counters include calls without a closing date', async () => {
    const t = convexTest(schema, modules);
    await withCall(t, { closesInDays: 2 });
    await withCall(t, { closesInDays: null });
    await withCall(t, { closesInDays: 40_000 });
    await withCall(t, { closesInDays: -1 });
    const list = await t.query(api.matching.callNoticeCards, everyOpenCall);
    const counters = await t.query(api.matching.callNoticeCounters, {});
    expect(counters.open).toBe(list.page.length);
    expect(counters.byClassification.eligible).toBe(
      list.page.filter((c) => c.classification === 'eligible').length,
    );
  });

  test('light cards keep their art forms without reading an extraction', async () => {
    const t = convexTest(schema, modules);
    const callNoticeId = await withCall(t, { closesInDays: 20 });
    await t.run(async (ctx) => {
      const row = await ctx.db
        .query('callNoticeExtractions')
        .withIndex('by_call_notice', (q) => q.eq('callNoticeId', callNoticeId))
        .unique();
      await ctx.db.delete(row!._id);
    });
    const list = await t.query(api.matching.callNoticeCards, everyOpenCall);
    expect(list.page[0]?.artForms).toEqual(['crafts']);
  });
});
