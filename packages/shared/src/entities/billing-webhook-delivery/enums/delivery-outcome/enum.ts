import { z } from 'zod';

/**
 * What processing a webhook delivery did to our rows: `applied` changed a subscription,
 * `unmatchedSubscription` named none of ours, `superseded` arrived after the row's terminal
 * status (cancelled is final), `ignored` was never meant for billing, `unparsed` carried no
 * usable `subs_...` or `bill_...` (the raw body is gone, so it cannot be reprocessed).
 */
export const DeliveryOutcomeEnum = z.enum([
  'applied',
  'unmatchedSubscription',
  'superseded',
  'ignored',
  'unparsed',
]);

export type DeliveryOutcome = z.infer<typeof DeliveryOutcomeEnum>;
