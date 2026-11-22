import { z } from 'zod';
import { nullableString, requiredString } from '@bratura/shared/primitives/code/string/fields';
import { requiredAmountInCents } from '@bratura/shared/primitives/domain/money/fields';
import type { CancellationReason } from '@bratura/shared/primitives/external/abacate-pay/enums/cancellation-reason/enum';
import { PaymentMethodEnum } from '@bratura/shared/primitives/external/abacate-pay/enums/payment-method/enum';

// AbacatePay answers: a 2xx wraps the resource as `{ data: …, success, error }`; a non-2xx
// answers `{ error: "…" }`. Schemas stay loose on purpose — the provider warns fields may be
// added, and a rigid schema would break a working endpoint.

/** The `data` member of a 2xx answer, plus list pagination when the route has it. */
export const AbacatePayEnvelopeSchema = z.looseObject({
  data: z.unknown().optional(),
  error: z.string().nullable().optional(),
  pagination: z
    .looseObject({
      hasMore: z.boolean().optional(),
      next: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

/** `GET /stores/get`: proves an `ABACATE_PAY_API_KEY` is real and names the store. */
export const AbacatePayStoreSchema = z.looseObject({ id: z.string(), name: z.string() });

/** A product (`prod_...`): only the id is read back. */
export const AbacatePayProductSchema = z.looseObject({ id: z.string() });

/** A row of `GET /products/list`: the `prod_...` and our `externalId` on it. */
export const AbacatePayProductListItemSchema = z.looseObject({
  id: z.string(),
  externalId: z.string().nullable().optional(),
});

/** A customer (`cust_...`): only the id is kept. */
export const AbacatePayCustomerSchema = z.looseObject({ id: z.string() });

/** The subscription checkout (`bill_...`) the organization pays at `url`. */
export const AbacatePaySubscriptionCheckoutSchema = z.looseObject({
  id: z.string(),
  url: requiredString(),
  devMode: z.boolean().optional(),
});

/** The pending plan change (`subu_...`) a change-plan call schedules. */
export const AbacatePayPlanChangeSchema = z.looseObject({ id: z.string() });

/** A registered webhook (`webh_...`). */
export const AbacatePayWebhookSchema = z.looseObject({ id: z.string() });

/**
 * A webhook delivery's envelope: `id` is the dedupe key (retries resend it), `data` is parsed
 * field by field, because a bad field must not erase the good ones.
 */
export const AbacatePayDeliveryEnvelopeSchema = z.looseObject({
  id: requiredString('short'),
  event: requiredString('short'),
  devMode: z.boolean().optional(),
  data: z.unknown().optional(),
});

/**
 * The provider's `cancelledDueTo` is free text that can carry a payer-typed reason — it is
 * read only to map it to our enum and is never stored or logged (`docs/security.md` §4).
 * Texts and codes come from the provider's subscriptions-events table.
 */
export function cancellationReasonFromAbacatePay(raw: string | null): CancellationReason | null {
  if (raw === null) return null;
  if (raw.startsWith('Cancelada pelo cliente no portal')) return 'customerPortal';
  if (raw.startsWith('Cancelada pelo reembolso pedido pelo cliente no portal')) {
    return 'customerRefund';
  }
  switch (raw) {
    case 'max_payment_retries_exceeded':
      return 'maxPaymentRetriesExceeded';
    case 'dispute_opened':
      return 'disputeOpened';
    case 'pix_automatic_authorization_refused':
      return 'pixAuthorizationRefused';
    case 'Conta encerrada':
      return 'accountClosed';
    default:
      return 'other';
  }
}

/**
 * The `data` of a `subscription.*` delivery, `.catch` per field so a bad field becomes `null`
 * alone — an unknown `method` can no longer erase the event's ids. `cancelledDueTo` stays a
 * raw string with no ceiling: it feeds the mapper only. Personal members are never read.
 */
export const AbacatePayEventDataSchema = z.looseObject({
  subscription: z
    .looseObject({
      id: requiredString('short').nullish().catch(null),
      amount: requiredAmountInCents.nullish().catch(null),
      method: PaymentMethodEnum.nullish().catch(null),
      cancelledDueTo: z.string().nullish().catch(null),
    })
    .catch({}),
  checkout: z
    .looseObject({
      id: requiredString('short').nullish().catch(null),
    })
    .catch({}),
  pendingUpdateId: nullableString('short').catch(null),
  status: nullableString('short').catch(null),
  quantity: z.int().positive().nullish().catch(null),
  newAmount: requiredAmountInCents.nullish().catch(null),
});

/**
 * What a `subscription.*` event's `data` tells our rows. `quantity` reads `data.quantity` only:
 * the applied plan-change event keeps the checkout's original items, so a fallback to
 * `checkout.items` would hand back the old quantity.
 */
export function deliveryFieldsFromAbacatePayEvent(data: unknown) {
  const parsed = AbacatePayEventDataSchema.parse(data);
  const record = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {};
  const rawSubscription =
    typeof record.subscription === 'object' && record.subscription !== null
      ? (record.subscription as Record<string, unknown>)
      : {};
  const rawCheckout =
    typeof record.checkout === 'object' && record.checkout !== null
      ? (record.checkout as Record<string, unknown>)
      : {};
  return {
    abacatePaySubscriptionId: parsed.subscription.id ?? null,
    abacatePayCheckoutId: parsed.checkout.id ?? null,
    /** Whether the raw event carried each id — present-but-invalid shows up in the log. */
    subscriptionIdPresent: rawSubscription.id !== undefined,
    checkoutIdPresent: rawCheckout.id !== undefined,
    amountInCents: parsed.subscription.amount ?? null,
    method: parsed.subscription.method ?? null,
    pendingUpdateId: parsed.pendingUpdateId ?? null,
    planChangeStatus: parsed.status ?? null,
    quantity: parsed.quantity ?? null,
    newAmountInCents: parsed.newAmount ?? null,
    cancelledDueTo: cancellationReasonFromAbacatePay(parsed.subscription.cancelledDueTo ?? null),
  };
}
