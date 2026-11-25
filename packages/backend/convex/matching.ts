import {
  matchProfileFromPortfolio,
  type MatchProfile,
} from '@bratura/shared/entities/match/profile';
import {
  CallNoticeCardsQueryFromBraturaPortalArgsSchema,
  CallNoticeCardsQueryFromBraturaPortalReturnsSchema,
  type CallNoticeCard,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-cards/query';
import { callNoticeCounterCeiling } from '@bratura/shared/entities/call-notice-counters/entity';
import {
  CallNoticeCountersQueryFromBraturaPortalArgsSchema,
  CallNoticeCountersQueryFromBraturaPortalReturnsSchema,
  type CallNoticeCounters,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-counters/query';
import {
  CallNoticeDetailsQueryFromBraturaPortalArgsSchema,
  CallNoticeDetailsQueryFromBraturaPortalReturnsSchema,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-details/query';
import {
  callNoticeHighlightsCount,
  CallNoticeHighlightsQueryFromBraturaPortalArgsSchema,
  CallNoticeHighlightsQueryFromBraturaPortalReturnsSchema,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-highlights/query';
import {
  SavedCallNoticeCardsQueryFromBraturaPortalArgsSchema,
  SavedCallNoticeCardsQueryFromBraturaPortalReturnsSchema,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/saved-call-notice-cards/query';
import { openEndedRegistrationAfterMs } from '@bratura/shared/entities/call-notice/fragments/registration-window/fields';
import {
  FICTIONAL_CREATOR,
  FICTIONAL_CREATOR_PORTFOLIO_ITEMS,
} from '@bratura/shared/entities/creator/demo/fictional-creator';
import {
  MatchClassificationEnum,
  type MatchClassification,
} from '@bratura/shared/entities/match/enums/classification/enum';
import { documentId } from '@bratura/shared/primitives/code/id/fields';
import { z } from 'zod';
import { internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';
import { appError } from './lib/appError';
import { internalZodMutation, publicZodQuery } from './lib/builders';
import {
  closeRange,
  dayInMs,
  closesAtForOrdering,
  deadlineForCreators,
  isInCloseFilter,
} from './model/matching/closeRange';
import {
  distinctArtFormValues,
  largestAmountPerProjectInCents,
  matchCallNotice,
  matchClassificationOnDeadline,
} from './model/matching/matchCallNotice';

// Matching: how each call for creators fits the profile. The only writer of `matches`, and the
// reads the site's call screens make. Return types are written out: this module schedules its own
// functions through `internal`.

/** The one profile until `creators` exists: the fictional creator (competition rule 6.9). */
const profile: MatchProfile = matchProfileFromPortfolio(
  FICTIONAL_CREATOR,
  FICTIONAL_CREATOR_PORTFOLIO_ITEMS,
);

/** An open call closes soon when its close is this many days away or fewer. */
export const closesSoonWithinDays = 7;
/** A call first seen this many days ago or fewer is new. */
export const newCallNoticeWithinDays = 7;
/** How many rows one page of cards reads at most, the ones its filter drops included. */
export const callNoticeCardsRowsReadMax = 500;

// The writer -------------------------------------------------------------------------------------

/** "Best fit first": eligible, almost, not, and last a call already closed when matched. */
const fitRankByClassification: Record<MatchClassification, number> = {
  eligible: 0,
  almostEligible: 1,
  notEligible: 2,
};
const closedFitRank = 3;

/** Stores the call's match, or removes it when the call is not (or no longer) one for creators. */
async function storeMatchOfCallNotice(ctx: MutationCtx, callNoticeId: Id<'callNotices'>) {
  const [callNotice, extraction, known] = await Promise.all([
    ctx.db.get(callNoticeId),
    ctx.db
      .query('callNoticeExtractions')
      .withIndex('by_call_notice', (index) => index.eq('callNoticeId', callNoticeId))
      .unique(),
    ctx.db
      .query('matches')
      .withIndex('by_call_notice', (index) => index.eq('callNoticeId', callNoticeId))
      .unique(),
  ]);
  if (!callNotice || extraction?.isCreatorCall?.value !== true) {
    if (known) await ctx.db.delete(known._id);
    return;
  }
  const now = Date.now();
  const { classification } = matchCallNotice(profile, extraction, callNotice, now);
  const row = {
    callNoticeId,
    classification,
    closesAtForOrdering: closesAtForOrdering(callNotice, now),
    largestAmountPerProjectInCents: largestAmountPerProjectInCents(extraction),
    callNoticeFirstSeenAt: callNotice.firstSeenAt,
    artForms: distinctArtFormValues(extraction),
    fitRankForOrdering:
      deadlineForCreators(callNotice, now) === 'closed'
        ? closedFitRank
        : fitRankByClassification[classification],
    computedAt: now,
  };
  if (known) await ctx.db.replace(known._id, row);
  else await ctx.db.insert('matches', row);
}

const RecomputeMatchOfCallNoticeMutationArgsSchema = z.object({
  callNoticeId: documentId('callNotices'),
});

/** One call's match again: scheduled by `recordExtraction` when its extraction is stored. */
export const recomputeMatchOfCallNotice = internalZodMutation({
  args: RecomputeMatchOfCallNoticeMutationArgsSchema,
  returns: z.null(),
  handler: async (ctx, { callNoticeId }): Promise<null> => {
    await storeMatchOfCallNotice(ctx, callNoticeId);
    return null;
  },
});

/** Extractions matched per run of `recomputeMatches`: well under a mutation's limits. */
export const recomputeMatchesBatch = 50;

const RecomputeMatchesMutationArgsSchema = z.object({ cursor: z.string().nullable() });
const RecomputeMatchesMutationReturnsSchema = z.object({
  matched: z.int().nonnegative(),
  done: z.boolean(),
});

/**
 * Every call's match again, a batch per run, scheduling itself until done, then the counters:
 * daily after ingestion (a close may have moved, a paper of the profile may have expired) and by
 * hand after extracting: `pnpm exec convex run matching:recomputeMatches '{"cursor":null}'`.
 */
export const recomputeMatches = internalZodMutation({
  args: RecomputeMatchesMutationArgsSchema,
  returns: RecomputeMatchesMutationReturnsSchema,
  handler: async (ctx, { cursor }): Promise<{ matched: number; done: boolean }> => {
    const { page, isDone, continueCursor } = await ctx.db
      .query('callNoticeExtractions')
      .paginate({ numItems: recomputeMatchesBatch, cursor });
    for (const { callNoticeId } of page) await storeMatchOfCallNotice(ctx, callNoticeId);
    if (isDone) await ctx.scheduler.runAfter(0, internal.matching.storeCallNoticeCounters, {});
    else
      await ctx.scheduler.runAfter(0, internal.matching.recomputeMatches, {
        cursor: continueCursor,
      });
    return { matched: page.length, done: isDone };
  },
});

// The reads --------------------------------------------------------------------------------------

function callNoticeTiming(callNotice: Doc<'callNotices'>, now: number) {
  const deadline = deadlineForCreators(callNotice, now);
  return {
    deadline,
    isNew: callNotice.firstSeenAt >= now - newCallNoticeWithinDays * dayInMs,
    closesSoon:
      deadline === 'open' &&
      callNotice.registrationCloses !== null &&
      callNotice.registrationCloses.at <= now + closesSoonWithinDays * dayInMs,
  };
}

/** The card of a match's call; `null` when the call or its source is gone. */
async function cardOfMatch(
  ctx: QueryCtx,
  match: Doc<'matches'>,
  now: number,
): Promise<CallNoticeCard | null> {
  const callNotice = await ctx.db.get(match.callNoticeId);
  if (!callNotice) return null;
  const source = await ctx.db.get(callNotice.sourceId);
  if (!source) return null;
  const deadline = deadlineForCreators(callNotice, now);
  return {
    callNoticeId: callNotice._id,
    title: callNotice.title,
    officialUrl: callNotice.officialUrl,
    registrationOpens: callNotice.registrationOpens,
    registrationCloses: callNotice.registrationCloses,
    firstSeenAt: callNotice.firstSeenAt,
    organizer: source.name,
    ...callNoticeTiming(callNotice, now),
    largestAmountPerProjectInCents: match.largestAmountPerProjectInCents,
    artForms: match.artForms ?? [],
    classification: matchClassificationOnDeadline(match.classification, deadline),
  };
}

/**
 * The calls for creators, a page at a time. Closing first, the close filter and the classification
 * are one index range; best fit first, by amount or by newest, the index gives the order and the
 * server keeps the rows of the filter while it reads the page. The range is `closeRange`'s, steady
 * between pages; the exact close is checked on each row. A closed call never comes as `eligible`.
 * A page stops at `callNoticeCardsRowsReadMax` rows read, full or not: the next one goes on from
 * there.
 */
export const callNoticeCards = publicZodQuery({
  args: CallNoticeCardsQueryFromBraturaPortalArgsSchema,
  returns: CallNoticeCardsQueryFromBraturaPortalReturnsSchema,
  handler: async (ctx, { classification, closes, sort, paginationOpts }) => {
    const now = Date.now();
    // Every closed call reads `notEligible`, whatever fit is stored: none has another one.
    if (closes === 'closed' && classification !== null && classification !== 'notEligible')
      return { page: [], isDone: true, continueCursor: '' };
    const storedClassification = closes === 'closed' ? null : classification;
    const { from, to } = closeRange({ closes, now });
    // The most recently closed first; every other list from the nearest close on.
    const closingOrder = closes === 'closed' ? 'desc' : 'asc';
    // Best fit first within one classification, or among closed calls (all `notEligible`), is the
    // closing order.
    const order =
      sort === 'bestFit' && (storedClassification !== null || closes === 'closed')
        ? 'closestDeadline'
        : sort;
    const matches =
      order === 'bestFit'
        ? ctx.db
            .query('matches')
            .withIndex('by_fit_and_closes')
            .filter((row) =>
              row.and(
                row.gte(row.field('closesAtForOrdering'), from),
                row.lte(row.field('closesAtForOrdering'), to),
              ),
            )
        : order === 'closestDeadline'
          ? storedClassification === null
            ? ctx.db
                .query('matches')
                .withIndex('by_closes', (index) =>
                  index.gte('closesAtForOrdering', from).lte('closesAtForOrdering', to),
                )
                .order(closingOrder)
            : ctx.db
                .query('matches')
                .withIndex('by_classification_and_closes', (index) =>
                  index
                    .eq('classification', storedClassification)
                    .gte('closesAtForOrdering', from)
                    .lte('closesAtForOrdering', to),
                )
                .order(closingOrder)
          : ctx.db
              .query('matches')
              .withIndex(order === 'largestAmount' ? 'by_largest_amount' : 'by_first_seen')
              .order('desc')
              .filter((row) =>
                row.and(
                  row.gte(row.field('closesAtForOrdering'), from),
                  row.lte(row.field('closesAtForOrdering'), to),
                  storedClassification === null ||
                    row.eq(row.field('classification'), storedClassification),
                ),
              );
    const result = await matches.paginate({
      ...paginationOpts,
      maximumRowsRead: callNoticeCardsRowsReadMax,
    });
    const cards = await Promise.all(
      result.page
        .filter(({ closesAtForOrdering }) =>
          isInCloseFilter({ closes, closesAt: closesAtForOrdering, now }),
        )
        .map((match) => cardOfMatch(ctx, match, now)),
    );
    return { ...result, page: cards.filter((card) => card !== null) };
  },
});

/** The cards of the calls a creator saved, in the order given; an id with no match is left out. */
export const savedCallNoticeCards = publicZodQuery({
  args: SavedCallNoticeCardsQueryFromBraturaPortalArgsSchema,
  returns: SavedCallNoticeCardsQueryFromBraturaPortalReturnsSchema,
  handler: async (ctx, { callNoticeIds }) => {
    const now = Date.now();
    const cards = await Promise.all(
      callNoticeIds.map(async (callNoticeId) => {
        const match = await ctx.db
          .query('matches')
          .withIndex('by_call_notice', (index) => index.eq('callNoticeId', callNoticeId))
          .unique();
        return match && (await cardOfMatch(ctx, match, now));
      }),
    );
    return cards.filter((card) => card !== null);
  },
});

/** What a visitor sees: the open calls closing first, a fixed few, with no fit. */
export const callNoticeHighlights = publicZodQuery({
  args: CallNoticeHighlightsQueryFromBraturaPortalArgsSchema,
  returns: CallNoticeHighlightsQueryFromBraturaPortalReturnsSchema,
  handler: async (ctx) => {
    const now = Date.now();
    const matches = await ctx.db
      .query('matches')
      .withIndex('by_closes', (index) =>
        index
          .gte('closesAtForOrdering', now)
          .lte('closesAtForOrdering', now + openEndedRegistrationAfterMs),
      )
      .take(callNoticeHighlightsCount);
    const cards = await Promise.all(matches.map((match) => cardOfMatch(ctx, match, now)));
    // `returns` leaves the fit out: a visitor has no profile.
    return cards.filter((card) => card !== null);
  },
});

/** How many rows an index range holds, up to the counters' ceiling. */
async function countUpToCeiling(rows: { take: (count: number) => Promise<unknown[]> }) {
  return (await rows.take(callNoticeCounterCeiling)).length;
}

/** Every counter the call screens show, each one an index range read up to the ceiling. */
async function countCallNotices(ctx: QueryCtx, now: number): Promise<CallNoticeCounters> {
  const closingBetween = (from: number, to: number) =>
    ctx.db
      .query('matches')
      .withIndex('by_closes', (index) =>
        index.gte('closesAtForOrdering', from).lte('closesAtForOrdering', to),
      );
  const [open, closingSoon, isNew, ...byClassification] = await Promise.all([
    countUpToCeiling(closingBetween(now, Number.MAX_SAFE_INTEGER)),
    countUpToCeiling(closingBetween(now, now + closesSoonWithinDays * dayInMs)),
    countUpToCeiling(
      ctx.db
        .query('matches')
        .withIndex('by_first_seen', (index) =>
          index.gte('callNoticeFirstSeenAt', now - newCallNoticeWithinDays * dayInMs),
        ),
    ),
    ...MatchClassificationEnum.options.map((classification) =>
      countUpToCeiling(
        ctx.db
          .query('matches')
          .withIndex('by_classification_and_closes', (index) =>
            index.eq('classification', classification).gte('closesAtForOrdering', now),
          ),
      ),
    ),
  ]);
  const [eligible = 0, almostEligible = 0, notEligible = 0] = byClassification;
  return {
    open,
    closingSoon,
    isNew,
    byClassification: { eligible, almostEligible, notEligible },
  };
}

const StoreCallNoticeCountersMutationArgsSchema = z.object({});

/**
 * Stores the counters in their one row: scheduled when the daily recompute is done, or by hand:
 * `pnpm exec convex run matching:storeCallNoticeCounters '{}'`.
 */
export const storeCallNoticeCounters = internalZodMutation({
  args: StoreCallNoticeCountersMutationArgsSchema,
  returns: z.null(),
  handler: async (ctx): Promise<null> => {
    const now = Date.now();
    const row = { ...(await countCallNotices(ctx, now)), countedAt: now };
    const stored = await ctx.db.query('callNoticeCounters').first();
    if (stored) await ctx.db.replace(stored._id, row);
    else await ctx.db.insert('callNoticeCounters', row);
    return null;
  },
});

/**
 * The screens' counters as the last recompute stored them: one small row instead of ~400 matches
 * per visit. Counted live only until the first recompute after a deploy has stored them.
 */
export const callNoticeCounters = publicZodQuery({
  args: CallNoticeCountersQueryFromBraturaPortalArgsSchema,
  returns: CallNoticeCountersQueryFromBraturaPortalReturnsSchema,
  handler: async (ctx) => {
    const stored = await ctx.db.query('callNoticeCounters').first();
    if (!stored) return await countCallNotices(ctx, Date.now());
    const { open, closingSoon, isNew, byClassification } = stored;
    return { open, closingSoon, isNew, byClassification };
  },
});

/**
 * One call with everything its details show, the fit item by item included. A call whose documents
 * were not read comes with a `null` extraction: the screen shows its official link alone.
 */
export const callNoticeDetails = publicZodQuery({
  args: CallNoticeDetailsQueryFromBraturaPortalArgsSchema,
  returns: CallNoticeDetailsQueryFromBraturaPortalReturnsSchema,
  handler: async (ctx, { callNoticeId, profile: requestedProfile }) => {
    const now = Date.now();
    const callNotice = await ctx.db.get(callNoticeId);
    const source = callNotice && (await ctx.db.get(callNotice.sourceId));
    if (!callNotice || !source) throw appError({ code: 'notFound' });
    const extraction = await ctx.db
      .query('callNoticeExtractions')
      .withIndex('by_call_notice', (index) => index.eq('callNoticeId', callNoticeId))
      .unique();
    const deadline = deadlineForCreators(callNotice, now);
    const match =
      extraction?.isCreatorCall?.value === true
        ? matchCallNotice(requestedProfile ?? profile, extraction, callNotice, now)
        : null;
    const { classification = null, ...matchChecks } = match ?? {};
    return {
      callNoticeId,
      title: callNotice.title,
      summary: callNotice.summary,
      officialUrl: callNotice.officialUrl,
      documentUrls: callNotice.documentUrls,
      documentLabels: callNotice.documentLabels,
      resultPosted: callNotice.resultPosted,
      registrationOpens: callNotice.registrationOpens,
      registrationCloses: callNotice.registrationCloses,
      firstSeenAt: callNotice.firstSeenAt,
      lastSeenAt: callNotice.lastSeenAt,
      organizer: source.name,
      ...callNoticeTiming(callNotice, now),
      largestAmountPerProjectInCents: extraction && largestAmountPerProjectInCents(extraction),
      artForms: distinctArtFormValues(extraction),
      extraction,
      classification: classification && matchClassificationOnDeadline(classification, deadline),
      matchChecks: match && (matchChecks as Omit<typeof match, 'classification'>),
    };
  },
});
