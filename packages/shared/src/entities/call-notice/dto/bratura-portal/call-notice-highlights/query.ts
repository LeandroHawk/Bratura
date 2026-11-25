import { z } from 'zod';
import { CallNoticeCardSchema } from '../call-notice-cards/query';

/** How many calls a visitor sees without signing in. */
export const callNoticeHighlightsCount = 3;

export const CallNoticeHighlightsQueryFromBraturaPortalArgsSchema = z.object({});

/** A call as the landing shows it: no fit, a visitor has no profile. */
export const CallNoticeHighlightSchema = CallNoticeCardSchema.omit({ classification: true });
export type CallNoticeHighlight = z.infer<typeof CallNoticeHighlightSchema>;

/** The open calls closing first, a fixed few: the full list needs the sign-in. */
export const CallNoticeHighlightsQueryFromBraturaPortalReturnsSchema = z
  .array(CallNoticeHighlightSchema)
  .max(callNoticeHighlightsCount);
