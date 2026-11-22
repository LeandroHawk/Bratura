import { z } from 'zod';
import { nullableString, requiredString } from '@bratura/shared/primitives/code/string/fields';
import { requiredAmountInCents } from '@bratura/shared/primitives/domain/money/fields';
import type { CancellationReason } from '@bratura/shared/primitives/external/abacate-pay/enums/cancellation-reason/enum';
import type { PaymentMethod } from '@bratura/shared/primitives/external/abacate-pay/enums/payment-method/enum';
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
export const AbacatePayStoreSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
});

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
export const AbacatePayPlanChangeSchema = z.looseObject({
  id: z.string(),
  newAmount: z.int().optional(),
});

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
export function mapAbacatePayCancellationReason(raw: unknown): CancellationReason | null {
  if (typeof raw !== 'string') return null;
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

/** What a `subscription.*` event's `data` tells our rows, one field at a time. */
export type AbacatePayEventFields = {
  abacatePaySubscriptionId: string | null;
  abacatePayCheckoutId: string | null;
  amountInCents: number | null;
  method: PaymentMethod | null;
  pendingUpdateId: string | null;
  planChangeStatus: string | null;
  quantity: number | null;
  newAmountInCents: number | null;
  cancelledDueTo: CancellationReason | null;
  /** Our field names for every field that failed to parse: for the `unparsed` log, no values. */
  issuePaths: string[];
};

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

const field = <T>(
  value: unknown,
  schema: z.ZodType<T>,
  path: string,
  issuePaths: string[],
): T | null => {
  const parsed = schema.safeParse(value);
  if (parsed.success) return parsed.data;
  issuePaths.push(path);
  return null;
};

/**
 * Parses the `data` of a webhook delivery field by field: a bad field becomes `null` alone —
 * a `cancelledDueTo` too long or a `method` we do not know can no longer erase the event's
 * ids. Personal members (`customer`, `payerInformation`) are never read.
 */
export function parseAbacatePayEventData(data: unknown): AbacatePayEventFields {
  const issuePaths: string[] = [];
  const dataRecord = asRecord(data);
  const subscription = asRecord(dataRecord.subscription);
  const checkout = asRecord(dataRecord.checkout);
  const firstItem = asRecord(Array.isArray(checkout.items) ? checkout.items[0] : undefined);
  const quantity =
    field(dataRecord.quantity, z.int().positive(), 'quantity', issuePaths) ??
    field(firstItem.quantity, z.int().positive(), 'checkout.items.0.quantity', issuePaths);
  return {
    abacatePaySubscriptionId: field(
      subscription.id,
      requiredString('short'),
      'subscription.id',
      issuePaths,
    ),
    abacatePayCheckoutId: field(checkout.id, requiredString('short'), 'checkout.id', issuePaths),
    amountInCents: field(
      subscription.amount,
      requiredAmountInCents,
      'subscription.amount',
      issuePaths,
    ),
    method: field(subscription.method, PaymentMethodEnum, 'subscription.method', issuePaths),
    pendingUpdateId: field(
      dataRecord.pendingUpdateId,
      nullableString('short'),
      'pendingUpdateId',
      issuePaths,
    ),
    planChangeStatus: field(dataRecord.status, nullableString('short'), 'status', issuePaths),
    quantity,
    newAmountInCents: field(dataRecord.newAmount, requiredAmountInCents, 'newAmount', issuePaths),
    cancelledDueTo: mapAbacatePayCancellationReason(
      subscription.cancelledDueTo ?? dataRecord.cancelledDueTo,
    ),
    issuePaths,
  };
}
