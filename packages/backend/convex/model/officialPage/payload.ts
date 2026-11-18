import {
  CallNoticeDocumentLabelSchema,
  CallNoticeListingFields,
} from '@bratura/shared/entities/call-notice/fragments/listing/fields';
import { CallNoticeRegistrationWindowFields } from '@bratura/shared/entities/call-notice/fragments/registration-window/fields';
import { z } from 'zod';

/**
 * One call as the reader found it on an official page: built by our code from HTML, parsed again
 * at the edge (`SourceReader`): a page that broke the reader's assumptions is counted, not stored.
 * The link texts stay as the page has them: the listing cuts them and drops empty ones. The close
 * is the one the page prints (`registrationClosePrintedIn`), `null` when it prints none.
 */
export const OfficialPageCallSchema = CallNoticeListingFields.pick({
  externalId: true,
  officialUrl: true,
})
  .extend({
    title: z.string(),
    documents: z.array(CallNoticeDocumentLabelSchema.extend({ label: z.string() })),
  })
  .extend(CallNoticeRegistrationWindowFields.pick({ registrationCloses: true }).shape);
export type OfficialPageCall = z.infer<typeof OfficialPageCallSchema>;

/**
 * One item of a JSON listing (`callPagesListedAsJson`): its id and, under the source's
 * `titleField`, its title. An item without both is skipped, not the listing.
 */
export const JsonListedCallSchema = z.looseObject({
  id: z.union([z.number().int(), z.string().trim().min(1)]),
});
