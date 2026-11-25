import { z } from 'zod';
import { CallNoticeCardSchema } from '../call-notice-cards/query';

/**
 * A call the creator keeps and whether they want reminders of its deadline. Sent whole on every
 * change (`set`, not `add`), so a double click saves once. Where a reminder goes is the user's
 * choice, not the call's (`userMessageChannels`).
 */
export const SetSavedCallNoticeMutationFromBraturaPortalArgsSchema = z.object({
  callNoticeId: CallNoticeCardSchema.shape.callNoticeId,
  remindersOn: z.boolean(),
});

export type SavedCallNotice = z.infer<typeof SetSavedCallNoticeMutationFromBraturaPortalArgsSchema>;
