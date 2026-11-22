import { z } from 'zod';
import { requiredInstant } from '../../primitives/code/time/instant/fields';
import {
  nullableAbacatePaySubscriptionId,
  nullableCancellationReason,
  nullablePaymentMethod,
  requiredAbacatePaySubscriptionId,
} from '../../primitives/external/abacate-pay/fields';
import { nullableAmountInCents } from '../../primitives/domain/money/fields';
import { BillingSubscriptionIdentityFields } from './fragments/identity/fields';

/**
 * Checkout opened, waiting for the first payment: the subscription (`subs_...`) does not exist
 * yet. `lastPaymentFailedAt` marks a refused first charge, which keeps the checkout payable.
 */
export const PendingBillingSubscriptionSchema = z.object({
  status: z.literal('pending'),
  ...BillingSubscriptionIdentityFields.shape,
  lastPaymentFailedAt: requiredInstant.nullable(),
});

/**
 * The panel is on: the provider charges every cycle. `pendingManagedProfiles` is a plan change
 * the provider applies only at the next charge — until then the billed quantity is
 * `managedProfiles`.
 */
export const ActiveBillingSubscriptionSchema = z.object({
  status: z.literal('active'),
  ...BillingSubscriptionIdentityFields.shape,
  /** The provider's subscription (`subs_...`), born from the first payment. */
  abacatePaySubscriptionId: requiredAbacatePaySubscriptionId,
  activatedAt: requiredInstant,
  /** How the cycle is charged; `null` when the event did not say. */
  method: nullablePaymentMethod,
  /** What the last cycle charged, in cents; `null` when the event did not say. */
  amountInCents: nullableAmountInCents,
  lastRenewedAt: requiredInstant.nullable(),
  /** A refused cycle charge: retries still run and the status stays `active`. */
  lastPaymentFailedAt: requiredInstant.nullable(),
  /** A quantity asked through change-plan, applied at the next charge. */
  pendingManagedProfiles: z.int().positive().nullable(),
});

/**
 * Ended: never bills again and never comes back (`docs/integrations/abacate-pay.md`). A
 * cancelled row can come from a pending checkout our own `checkouts/delete` closed, so the
 * subscription id stays nullable.
 */
export const CancelledBillingSubscriptionSchema = z.object({
  status: z.literal('cancelled'),
  ...BillingSubscriptionIdentityFields.shape,
  abacatePaySubscriptionId: nullableAbacatePaySubscriptionId,
  activatedAt: requiredInstant.nullable(),
  cancelledAt: requiredInstant,
  /** Our enum (`CancellationReasonEnum`), never the provider's free text. */
  cancelledDueTo: nullableCancellationReason,
});

/**
 * An organization's monthly panel subscription, billed per managed profile by AbacatePay
 * (`docs/product.md`, Who pays). Writes: `billing.ts` — a `billingWebhookDeliveries` event or a
 * direct provider call; the creator side never touches it.
 */
export const BillingSubscriptionSchema = z.discriminatedUnion('status', [
  PendingBillingSubscriptionSchema,
  ActiveBillingSubscriptionSchema,
  CancelledBillingSubscriptionSchema,
]);

export type BillingSubscription = z.infer<typeof BillingSubscriptionSchema>;
