import { z } from 'zod';
import { CallNoticeListingFields } from './fragments/listing/fields';
import { CallNoticeRegistrationWindowFields } from './fragments/registration-window/fields';
import { CallNoticeTrackingFields } from './fragments/tracking/fields';

/**
 * A call notice (edital): a public call for projects, prizes, fairs or festivals, as its official
 * source publishes it. One fragment per writer, by stage: `docs/architecture.md`, Call notice lifecycle.
 */
export const CallNoticeSchema = z.object({
  ...CallNoticeListingFields.shape,
  ...CallNoticeRegistrationWindowFields.shape,
  ...CallNoticeTrackingFields.shape,
});

export type CallNotice = z.infer<typeof CallNoticeSchema>;
