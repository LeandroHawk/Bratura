import { z } from 'zod';
import { CallNoticeOverviewItemSchema } from '../call-notice-overview/query';

/**
 * A call the creator keeps and how they want to be reminded of its deadline. Sent whole on every
 * change (`set`, not `add`), so a double click saves once.
 */
export const SetSavedCallNoticeMutationFromBraturaPortalArgsSchema = z.object({
  callNoticeId: CallNoticeOverviewItemSchema.shape.callNoticeId,
  remindersOn: z.boolean(),
  notifiesByEmail: z.boolean(),
  notifiesByWhatsApp: z.boolean(),
});

export type SavedCallNotice = z.infer<typeof SetSavedCallNoticeMutationFromBraturaPortalArgsSchema>;
