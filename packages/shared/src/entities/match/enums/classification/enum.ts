import { z } from 'zod';

/** The answer a creator gets for one call: can apply, can apply once gaps close, cannot. */
export const MatchClassificationEnum = z.enum(['eligible', 'almostEligible', 'notEligible']);
export type MatchClassification = z.infer<typeof MatchClassificationEnum>;
