import { z } from 'zod';
import { documentId } from '../../primitives/code/id/fields';
import { nullableString, requiredString } from '../../primitives/code/string/fields';
import { requiredInstant } from '../../primitives/code/time/instant/fields';
import {
  nullableAbacatePayCheckoutId,
  nullableAbacatePaySubscriptionId,
  nullableCancellationReason,
  nullablePaymentMethod,
} from '../../primitives/external/abacate-pay/fields';
import { nullableAmountInCents } from '../../primitives/domain/money/fields';
import { DeliveryOutcomeEnum } from './enums/delivery-outcome/enum';

/**
 * One webhook delivery from the billing provider (the inbox pattern): its `log_...` id is the
 * dedupe key — retries resend it. Stores what the event says about the subscription, never the
 * whole payload (`docs/security.md` §4). Written only by `billing.ts`.
 */
export const BillingWebhookDeliverySchema = z.object({
  /** The provider's delivery id (`log_...`): identical across retries, so it dedupes. */
  deliveryId: requiredString('short'),
  /** The event name as sent (`subscription.renewed`); kinds we do not map are kept too. */
  event: requiredString('short'),
  /** The provider's sandbox flag on the delivery. */
  devMode: z.boolean(),
  /** The `subs_...` and `bill_...` the event names, when it names them. */
  abacatePaySubscriptionId: nullableAbacatePaySubscriptionId,
  abacatePayCheckoutId: nullableAbacatePayCheckoutId,
  /** What the event's subscription charges per cycle, in cents, when it says. */
  amountInCents: nullableAmountInCents,
  method: nullablePaymentMethod,
  /** Set on a plan change the provider has not applied yet (`subu_...`). */
  pendingUpdateId: nullableString('short'),
  /** `data.status` on a plan change: `PENDING` until the next charge applies it. */
  planChangeStatus: nullableString('short'),
  /** The new quantity a plan change carries (`data.quantity` or the checkout's item). */
  quantity: z.int().positive().nullable(),
  /** The subscription's new charge on a plan change, in cents. */
  newAmountInCents: nullableAmountInCents,
  cancelledDueTo: nullableCancellationReason,
  /** Our row the event landed on; `null` while unmatched or unprocessed. */
  billingSubscriptionId: documentId('billingSubscriptions').nullable(),
  receivedAt: requiredInstant,
  /** `null` until `processAbacatePayDelivery` has run on it. */
  processedAt: requiredInstant.nullable(),
  outcome: DeliveryOutcomeEnum.nullable(),
});

export type BillingWebhookDelivery = z.infer<typeof BillingWebhookDeliverySchema>;
