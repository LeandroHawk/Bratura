import { z } from 'zod';

/**
 * What processing a webhook delivery did to our rows: `applied` changed a subscription,
 * `unmatchedSubscription` named none of ours, `superseded` arrived after the row's terminal
 * status (cancelled is final), `ignored` was never meant for billing.
 */
export const DeliveryOutcomeEnum = z.enum([
  'applied',
  'unmatchedSubscription',
  'superseded',
  'ignored',
]);

export type DeliveryOutcome = z.infer<typeof DeliveryOutcomeEnum>;
