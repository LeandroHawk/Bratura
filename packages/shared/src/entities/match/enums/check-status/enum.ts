import { z } from 'zod';

/**
 * How one thing a call asks stands against the profile. `needsConfirmation`: the profile cannot
 * answer it (a rule in words, a paper made for each application, a list that may be incomplete).
 */
export const MatchCheckStatusEnum = z.enum(['met', 'notMet', 'needsConfirmation']);
export type MatchCheckStatus = z.infer<typeof MatchCheckStatusEnum>;

/** A portfolio paper against a call's close: expired today, or valid today but not at the close. */
export const MatchPaperValidityEnum = z.enum(['valid', 'expiresBeforeClose', 'expired']);
export type MatchPaperValidity = z.infer<typeof MatchPaperValidityEnum>;
