import { z } from 'zod';

/**
 * Why a delivery stopped for good, as a code: a provider's own text stays in the logs. Transient
 * failures (timeout, 5xx, 429) never reach this enum — they release the claim and retry. The
 * non-provider codes end a delivery that could never be sent: no opted-in recipient left
 * (`optedOut`), its subject gone or closed (`subjectGone`), a newer fact making it pointless
 * (`superseded` — a deadline that moved, a `d7` a new-call notice already covers).
 */
export const NotificationDeliveryFailureEnum = z.enum([
  'providerRejected',
  'sendAttemptsExhausted',
  'optedOut',
  'subjectGone',
  'superseded',
]);

export type NotificationDeliveryFailure = z.infer<typeof NotificationDeliveryFailureEnum>;
