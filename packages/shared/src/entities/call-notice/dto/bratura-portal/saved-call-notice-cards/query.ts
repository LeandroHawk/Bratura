import { z } from 'zod';
import { CallNoticeCardSchema } from '../call-notice-cards/query';

/** How many saved calls one read answers. */
export const savedCallNoticesMax = 50;

export const SavedCallNoticeCardsQueryFromBraturaPortalArgsSchema = z.object({
  callNoticeIds: z.array(CallNoticeCardSchema.shape.callNoticeId).max(savedCallNoticesMax),
});

/** The cards of the calls a creator saved; an id no longer listed is left out. */
export const SavedCallNoticeCardsQueryFromBraturaPortalReturnsSchema = z
  .array(CallNoticeCardSchema)
  .max(savedCallNoticesMax);
