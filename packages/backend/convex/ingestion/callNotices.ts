import { CallNoticeListingFields } from '@bratura/shared/entities/call-notice/fragments/listing/fields';
import {
  CallNoticeRegistrationWindowFields,
  withOrderedRegistrationWindow,
} from '@bratura/shared/entities/call-notice/fragments/registration-window/fields';
import { documentId } from '@bratura/shared/primitives/code/id/fields';
import { internalZodMutation } from '../builders';

/** What ingestion sends: the source's listing and registration window; tracking is the server's. */
const RecordCallNoticeArgs = withOrderedRegistrationWindow(
  CallNoticeListingFields.extend(CallNoticeRegistrationWindowFields.shape),
);

/**
 * Stores a call notice as its source lists it now: a new one is inserted, a known one (same source
 * and external id) is updated in place, so a notice read every day stays one row.
 */
export const recordCallNotice = internalZodMutation({
  args: RecordCallNoticeArgs,
  returns: documentId('callNotices'),
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
      return known._id;
    }
    return await ctx.db.insert('callNotices', { ...listing, firstSeenAt: now, lastSeenAt: now });
  },
});
