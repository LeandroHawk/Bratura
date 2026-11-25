import type { MatchClassification } from '@bratura/shared/entities/match/enums/classification/enum';

/**
 * AbacatePay's reusable payment link for the Passe Edital, in test mode (payments are simulated).
 * While null, the call details show no pass button.
 */
export const PASS_CHECKOUT_URL: string | null = null;

/** The Passe Edital's link, only for a call the creator can apply to; null otherwise. */
export function passCheckoutUrlFor(classification: MatchClassification | null): string | null {
  if (classification !== 'eligible' && classification !== 'almostEligible') return null;
  return PASS_CHECKOUT_URL;
}
