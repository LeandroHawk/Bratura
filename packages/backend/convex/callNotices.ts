import { CallNoticeListingFields } from '@bratura/shared/entities/call-notice/fragments/listing/fields';
import {
  CallNoticeRegistrationWindowFields,
  withOrderedRegistrationWindow,
} from '@bratura/shared/entities/call-notice/fragments/registration-window/fields';
import { documentId } from '@bratura/shared/primitives/code/id/fields';
import { z } from 'zod';
import { internalZodMutation, type CallerArgs } from './lib/builders';

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
 * and external id) is updated in place, so a notice read every day stays one row (natural-key upsert).
 */
export const recordCallNotice = internalZodMutation({
  args: RecordCallNoticeMutationArgsSchema,
  returns: RecordCallNoticeMutationReturnsSchema,
  handler: async (ctx, listing) => {
    const now = Date.now();
    const known = await ctx.db
      .query('callNotices')
      .withIndex('by_source_and_external_id', (index) =>
        index.eq('sourceId', listing.sourceId).eq('externalId', listing.externalId),
      )
      .unique();
    if (known) {
      await ctx.db.patch(known._id, { ...listing, lastSeenAt: now });
      return { callNoticeId: known._id, isNew: false };
    }
    const callNoticeId = await ctx.db.insert('callNotices', {
      ...listing,
      firstSeenAt: now,
      lastSeenAt: now,
    });
    return { callNoticeId, isNew: true };
  },
});

/** What a source's reader hands over for one call notice: its listing and registration window. */
export type CallNoticeListingToRecord = CallerArgs<typeof RecordCallNoticeMutationArgsSchema>;
