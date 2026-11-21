import { z } from 'zod';
import { documentId } from '../../primitives/code/id/fields';
import { nullableString, requiredString } from '../../primitives/code/string/fields';
import { requiredAmountInCents } from '../../primitives/domain/money/fields';
import { requiredInstant } from '../../primitives/code/time/instant/fields';
import { PaymentMethodEnum } from '../billing-subscription/enums/payment-method/enum';
import { DeliveryOutcomeEnum } from './enums/delivery-outcome/enum';

/**
 * One webhook delivery from the billing provider (the inbox pattern): its `log_...` id is the
 * dedupe key — retries resend the same one. It stores what the event says about the subscription
 * and never the whole payload, which carries masked personal data (`docs/security.md` §4).
 * Writes: `billing.ts` — the http route records it, `processAbacatePayDelivery` resolves it.
 */
export const BillingWebhookDeliverySchema = z.object({
  /** The provider's delivery id (`log_...`): identical across retries, so it dedupes. */
  deliveryId: requiredString('short'),
  /** The event name as sent (`subscription.renewed`); kinds we do not map are kept too. */
  event: requiredString('short'),
  /** The provider's sandbox flag on the delivery. */
  devMode: z.boolean(),
  /** The `subs_...` and `bill_...` the event names, when it names them. */
  abacatePaySubscriptionId: nullableString('short'),
  abacatePayCheckoutId: nullableString('short'),
  /** What the event's subscription charges per cycle, in cents, when it says. */
  amountInCents: requiredAmountInCents.nullable(),
  method: PaymentMethodEnum.nullable(),
  /** Set on a plan change the provider has not applied yet. */
  pendingUpdateId: nullableString('short'),
  cancelledDueTo: nullableString('medium'),
  /** Our row the event landed on; `null` while unmatched or unprocessed. */
  billingSubscriptionId: documentId('billingSubscriptions').nullable(),
  receivedAt: requiredInstant,
  /** `null` until `processAbacatePayDelivery` has run on it. */
  processedAt: requiredInstant.nullable(),
  outcome: DeliveryOutcomeEnum.nullable(),
});

export type BillingWebhookDelivery = z.infer<typeof BillingWebhookDeliverySchema>;
