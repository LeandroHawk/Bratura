import {
  CallNoticeDocumentLabelSchema,
  CallNoticeListingFields,
} from '@bratura/shared/entities/call-notice/fragments/listing/fields';
import { z } from 'zod';

/**
 * One call as the reader found it on an official page: built by our code from HTML, parsed again
 * at the edge (`SourceReader`): a page that broke the reader's assumptions is counted, not stored.
 * The link texts stay as the page has them: the listing cuts them and drops empty ones.
 */
export const OfficialPageCallSchema = CallNoticeListingFields.pick({
  externalId: true,
  officialUrl: true,
}).extend({
  title: z.string(),
  documents: z.array(CallNoticeDocumentLabelSchema.extend({ label: z.string() })),
});
export type OfficialPageCall = z.infer<typeof OfficialPageCallSchema>;
