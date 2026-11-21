import { z } from 'zod';
import { requiredInstant } from '../../../../primitives/code/time/instant/fields';

/**
 * Writes: `notificationDeliveries.ts`, claiming a send (outbox pattern). A claimed delivery holds
 * a lease (`sendingSince` + `deliveryClaimLeaseMs`); a claim whose run died is taken over after
 * it. `attempts` counts claims, so a delivery that keeps failing stops at the cap.
 */
export const NotificationDeliveryReservationFields = z.object({
  /** Claims consumed so far. */
  attempts: z.int().nonnegative(),
  /** The live claim's start; `null` while the delivery waits for a run. */
  sendingSince: requiredInstant.nullable(),
});
