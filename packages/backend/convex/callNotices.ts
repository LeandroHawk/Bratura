import { CallNoticeSchema } from '@bratura/shared/entities/call-notice/entity';
import { CallNoticeListingFields } from '@bratura/shared/entities/call-notice/fragments/listing/fields';
import {
  CallNoticeRegistrationWindowFields,
  withOrderedRegistrationWindow,
} from '@bratura/shared/entities/call-notice/fragments/registration-window/fields';
import { documentId } from '@bratura/shared/primitives/code/id/fields';
import { z } from 'zod';
import { internal } from './_generated/api';
import { appError } from './lib/appError';
import { internalZodMutation, internalZodQuery, type CallerArgs } from './lib/builders';
import {
  closedWhenFirstSeen,
  closedWhenFirstSeenToStore,
} from './model/callNoticeDocuments/selection';

/** What ingestion sends: the source's listing and registration window; tracking is the server's. */
const RecordCallNoticeMutationArgsSchema = withOrderedRegistrationWindow(
  CallNoticeListingFields.extend(CallNoticeRegistrationWindowFields.shape),
);

const RecordCallNoticeMutationReturnsSchema = z.object({
  callNoticeId: documentId('callNotices'),
  isNew: z.boolean(),
});

/**
 * Stores a call notice as its source lists it now: a new one is inserted, a known one (same source
 * and external id) is updated in place, so a notice read every day stays one row (natural-key
 * upsert). Its `closedWhenFirstSeen` is the server's (`closedWhenFirstSeenToStore`).
 */
export const recordCallNotice = internalZodMutation({
  args: RecordCallNoticeMutationArgsSchema,
  returns: RecordCallNoticeMutationReturnsSchema,
  handler: async (ctx, listing): Promise<z.infer<typeof RecordCallNoticeMutationReturnsSchema>> => {
    const now = Date.now();
    const known = await ctx.db
      .query('callNotices')
      .withIndex('by_source_and_external_id', (index) =>
        index.eq('sourceId', listing.sourceId).eq('externalId', listing.externalId),
      )
      .unique();
    const closed = closedWhenFirstSeenToStore(listing, known, now);
    if (known) {
      // `resultPosted` spelled out: a listing without it clears a stale `true` (patch keeps a key
      // the caller leaves out).
      await ctx.db.patch(known._id, {
        ...listing,
        resultPosted: listing.resultPosted,
        closedWhenFirstSeen: closed,
        lastSeenAt: now,
      });
      // A match copies the call's close for its indexes: a moved close or a posted result is a
      // new match, or the lists would filter by the old one until the daily recompute.
      if (
        known.registrationCloses?.at !== listing.registrationCloses?.at ||
        (known.resultPosted === true) !== (listing.resultPosted === true)
      ) {
        await ctx.scheduler.runAfter(0, internal.matching.recomputeMatchOfCallNotice, {
          callNoticeId: known._id,
        });
      }
      return { callNoticeId: known._id, isNew: false };
    }
    const callNoticeId = await ctx.db.insert('callNotices', {
      ...listing,
      firstSeenAt: now,
      lastSeenAt: now,
      closedWhenFirstSeen: closed,
    });
    return { callNoticeId, isNew: true };
  },
});

/** Rows set per run of the backfill: well under a mutation's write limits. */
export const closedWhenFirstSeenBackfillBatch = 500;

const BackfillClosedWhenFirstSeenMutationArgsSchema = z.object({});
const BackfillClosedWhenFirstSeenMutationReturnsSchema = z.object({
  updated: z.number().int(),
  done: z.boolean(),
});

/**
 * Sets `closedWhenFirstSeen` on rows recorded before it (by their close alone), a batch per run,
 * through its index. Once after deploying the field; run again until `done`:
 * `pnpm exec convex run callNotices:backfillClosedWhenFirstSeen '{}'`.
 */
export const backfillClosedWhenFirstSeen = internalZodMutation({
  args: BackfillClosedWhenFirstSeenMutationArgsSchema,
  returns: BackfillClosedWhenFirstSeenMutationReturnsSchema,
  handler: async (ctx) => {
    const unset = await ctx.db
      .query('callNotices')
      .withIndex('by_closed_when_first_seen_and_registration_closes', (index) =>
        index.eq('closedWhenFirstSeen', undefined),
      )
      .take(closedWhenFirstSeenBackfillBatch);
    for (const callNotice of unset) {
      await ctx.db.patch(callNotice._id, { closedWhenFirstSeen: closedWhenFirstSeen(callNotice) });
    }
    return { updated: unset.length, done: unset.length < closedWhenFirstSeenBackfillBatch };
  },
});

/** What a source's reader hands over for one call notice: its listing and registration window. */
export type CallNoticeListingToRecord = CallerArgs<typeof RecordCallNoticeMutationArgsSchema>;

const GetCallNoticeQueryArgsSchema = z.object({ callNoticeId: documentId('callNotices') });
const GetCallNoticeQueryReturnsSchema = CallNoticeSchema;

/** A call notice by id, for what a notification says about it. */
export const getCallNotice = internalZodQuery({
  args: GetCallNoticeQueryArgsSchema,
  returns: GetCallNoticeQueryReturnsSchema,
  handler: async (ctx, { callNoticeId }) => {
    const callNotice = await ctx.db.get(callNoticeId);
    if (!callNotice) throw appError({ code: 'notFound' });
    return callNotice;
  },
});
