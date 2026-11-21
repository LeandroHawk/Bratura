import { z } from 'zod';
import { requiredString } from '@bratura/shared/primitives/code/string/fields';
import { requiredAmountInCents } from '@bratura/shared/primitives/domain/money/fields';
import { PaymentMethodEnum } from '@bratura/shared/entities/billing-subscription/enums/payment-method/enum';

// AbacatePay answers: a 2xx wraps the resource as `{ data: …, success, error }`; a non-2xx
// answers `{ error: "…" }`. Schemas stay loose on purpose — the provider warns fields may be
// added, and a rigid schema would break a working endpoint.

/** The `data` member of a 2xx answer. */
export const AbacatePayEnvelopeSchema = z.looseObject({
  data: z.unknown().optional(),
  error: z.string().nullable().optional(),
});

/** `GET /stores/get`: proves an `ABACATE_PAY_API_KEY` is real and names the store. */
export const AbacatePayStoreSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
});

/** A product (`prod_...`): only the id is read back. */
export const AbacatePayProductSchema = z.looseObject({ id: z.string() });

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
 * separately and loosely, because the provider may add fields.
 */
export const AbacatePayDeliveryEnvelopeSchema = z.looseObject({
  id: requiredString('short'),
  event: requiredString('short'),
  devMode: z.boolean().optional(),
  data: z.unknown().optional(),
});

/**
 * The `data` of a `subscription.*` event, down to what our rows need. Personal fields
 * (`customer`, `payerInformation`) are never parsed: they would be dropped anyway, and not
 * reading them is stronger than dropping them.
 */
export const AbacatePaySubscriptionEventDataSchema = z.looseObject({
  subscription: z
    .looseObject({
      id: requiredString('short'),
      amount: requiredAmountInCents.optional(),
      method: PaymentMethodEnum.optional(),
      cancelledDueTo: z.string().trim().max(200).nullable().optional(),
      cancelPolicy: z.string().nullable().optional(),
      updatedAt: z.string().optional(),
    })
    .optional(),
  checkout: z.looseObject({ id: requiredString('short') }).optional(),
  pendingUpdateId: requiredString('short').nullable().optional(),
});

export type AbacatePaySubscriptionEventData = z.infer<
  typeof AbacatePaySubscriptionEventDataSchema
>;
