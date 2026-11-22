import { nullableString, requiredString } from '../../code/string/fields';
import { CancellationReasonEnum } from './enums/cancellation-reason/enum';
import { PaymentMethodEnum } from './enums/payment-method/enum';

/**
 * The billing provider's ids and values, shared by `billingSubscriptions` (the row) and
 * `billingWebhookDeliveries` (what an event says about it): the provider's own names, stored
 * as sent or `null` when the event does not say.
 */
export const requiredAbacatePayCheckoutId = requiredString('short');
export const nullableAbacatePayCheckoutId = nullableString('short');
export const requiredAbacatePaySubscriptionId = requiredString('short');
export const nullableAbacatePaySubscriptionId = nullableString('short');
export const nullablePaymentMethod = PaymentMethodEnum.nullable();
export const nullableCancellationReason = CancellationReasonEnum.nullable();
