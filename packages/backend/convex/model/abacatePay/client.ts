import { z } from 'zod';
import { appError } from '../../lib/appError';
import {
  AbacatePayCustomerSchema,
  AbacatePayEnvelopeSchema,
  AbacatePayPlanChangeSchema,
  AbacatePayProductListItemSchema,
  AbacatePayProductSchema,
  AbacatePayStoreSchema,
  AbacatePaySubscriptionCheckoutSchema,
  AbacatePayWebhookSchema,
} from './payload';

const abacatePayTimeoutMs = 15_000;
const abacatePayBaseUrl = 'https://api.abacatepay.com/v2';
/** How many catalog pages `findAbacatePayProduct` walks before giving up. */
const abacatePayProductListPageCeiling = 10;
/** Retries the provider runs on a failed subscription charge (3 tries, 2 days apart). */
const abacatePayChargeRetryPolicy = { maxRetry: 3, retryEvery: 2 };

/**
 * Calls one API route: Bearer auth, JSON, timeout on every call. Any failure — non-2xx, a 2xx
 * envelope carrying `error`, a bad envelope, timeout — ends as `unavailable` with only the
 * status and route in the log: the provider's error text never reaches a table or a caller.
 */
async function callAbacatePay(
  apiKey: string,
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>,
): Promise<{ data: unknown; pagination: { hasMore?: boolean; next?: string | null } | null }> {
  let response: Response;
  try {
    response = await fetch(`${abacatePayBaseUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(abacatePayTimeoutMs),
    });
  } catch {
    console.error(`AbacatePay ${method} ${path} did not answer`);
    throw appError({ code: 'unavailable' });
  }
  if (!response.ok) {
    console.error(`AbacatePay ${method} ${path} answered HTTP ${response.status}`);
    throw appError({ code: 'unavailable' });
  }
  const envelope = AbacatePayEnvelopeSchema.safeParse(await response.json().catch(() => null));
  if (!envelope.success || envelope.data.error) {
    console.error(`AbacatePay ${method} ${path} answered a failed or malformed envelope`);
    throw appError({ code: 'unavailable' });
  }
  return { data: envelope.data.data, pagination: envelope.data.pagination ?? null };
}

/** `GET /stores/get`: proves an api key answers and names the store; writes nothing. */
export async function fetchAbacatePayStore({
  apiKey,
}: {
  apiKey: string;
}): Promise<{ id: string; name: string }> {
  const { data } = await callAbacatePay(apiKey, 'GET', '/stores/get');
  const store = AbacatePayStoreSchema.parse(data);
  return { id: store.id, name: store.name };
}

/**
 * Walks `GET /products/list` for our `externalId`, up to the page ceiling: `/products/get`
 * answers 400 on a miss, indistinguishable from a real bad request, so the listing is the
 * lookup that does not depend on error text.
 */
export async function findAbacatePayProduct({
  apiKey,
  externalId,
}: {
  apiKey: string;
  externalId: string;
}): Promise<{ id: string } | null> {
  let cursor: string | null = null;
  for (let page = 0; page < abacatePayProductListPageCeiling; page += 1) {
    const query = cursor === null ? '' : `?cursor=${encodeURIComponent(cursor)}`;
    const { data, pagination } = await callAbacatePay(apiKey, 'GET', `/products/list${query}`);
    const items = z.array(AbacatePayProductListItemSchema).parse(data ?? []);
    const found = items.find((item) => item.externalId === externalId);
    if (found) return { id: found.id };
    cursor = pagination?.hasMore ? (pagination.next ?? null) : null;
    if (cursor === null) return null;
  }
  return null;
}

/**
 * `POST /products/create`: a subscription product (`cycle` makes it one). Returns the `prod_...`
 * id to keep as `ABACATE_PAY_PRODUCT_ID`.
 */
export async function createAbacatePayProduct({
  apiKey,
  externalId,
  name,
  priceInCents,
  cycle,
  trialDays,
}: {
  apiKey: string;
  externalId: string;
  name: string;
  priceInCents: number;
  cycle: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'ANNUALLY';
  trialDays?: number;
}): Promise<{ id: string }> {
  const { data } = await callAbacatePay(apiKey, 'POST', '/products/create', {
    externalId,
    name,
    price: priceInCents,
    currency: 'BRL',
    cycle,
    ...(trialDays === undefined ? {} : { trialDays }),
  });
  const product = AbacatePayProductSchema.parse(data);
  return { id: product.id };
}

/**
 * `POST /customers/create`: AbacatePay dedupes by CPF/CNPJ, then e-mail, then cellphone — a
 * second call for the same organization returns its existing customer.
 */
export async function upsertAbacatePayCustomer({
  apiKey,
  email,
  name,
  taxId,
  cellphone,
}: {
  apiKey: string;
  email: string;
  name?: string;
  taxId?: string;
  cellphone?: string;
}): Promise<{ id: string }> {
  const { data } = await callAbacatePay(apiKey, 'POST', '/customers/create', {
    email,
    ...(name === undefined ? {} : { name }),
    ...(taxId === undefined ? {} : { taxId }),
    ...(cellphone === undefined ? {} : { cellphone }),
  });
  const customer = AbacatePayCustomerSchema.parse(data);
  return { id: customer.id };
}

/**
 * `POST /subscriptions/create`: the checkout (`bill_...`) the organization pays the first cycle
 * at. The provider answers the existing checkout when `externalId` repeats — a second call for
 * the same organization never opens a second checkout.
 */
export async function createAbacatePaySubscriptionCheckout({
  apiKey,
  productId,
  quantity,
  customerId,
  externalId,
  methods,
  completionUrl,
}: {
  apiKey: string;
  productId: string;
  quantity: number;
  customerId: string;
  externalId: string;
  methods: Array<'CARD' | 'PIX'>;
  completionUrl?: string;
}): Promise<{ id: string; url: string; devMode: boolean }> {
  const { data } = await callAbacatePay(apiKey, 'POST', '/subscriptions/create', {
    items: [{ id: productId, quantity }],
    customerId,
    externalId,
    methods,
    retryPolicy: abacatePayChargeRetryPolicy,
    ...(completionUrl === undefined ? {} : { completionUrl }),
  });
  const checkout = AbacatePaySubscriptionCheckoutSchema.parse(data);
  return { id: checkout.id, url: checkout.url, devMode: checkout.devMode ?? false };
}

/** `POST /subscriptions/cancel`: ends an active subscription on the spot (`cancelPolicy: NOW`). */
export async function cancelAbacatePaySubscription({
  apiKey,
  subscriptionId,
}: {
  apiKey: string;
  subscriptionId: string;
}): Promise<void> {
  await callAbacatePay(apiKey, 'POST', '/subscriptions/cancel', { id: subscriptionId });
}

/** `POST /subscriptions/checkouts/delete?id=...`: an unpaid `bill_...` stops accepting payment. */
export async function deleteAbacatePaySubscriptionCheckout({
  apiKey,
  checkoutId,
}: {
  apiKey: string;
  checkoutId: string;
}): Promise<void> {
  await callAbacatePay(
    apiKey,
    'POST',
    `/subscriptions/checkouts/delete?id=${encodeURIComponent(checkoutId)}`,
  );
}

/**
 * `POST /subscriptions/change-plan`: schedules a new quantity at the next cycle — nothing is
 * charged or applied now (the `subscription.plan_changed` event confirms it twice).
 */
export async function changeAbacatePayPlan({
  apiKey,
  subscriptionId,
  productId,
  quantity,
}: {
  apiKey: string;
  subscriptionId: string;
  productId: string;
  quantity: number;
}): Promise<{ updateId: string; newAmountInCents: number | null }> {
  const { data } = await callAbacatePay(apiKey, 'POST', '/subscriptions/change-plan', {
    id: subscriptionId,
    productId,
    quantity,
  });
  const change = AbacatePayPlanChangeSchema.parse(data);
  return { updateId: change.id, newAmountInCents: change.newAmount ?? null };
}

/**
 * `POST /webhooks/create`: registers our endpoint for the events we handle. The secret is ours,
 * 32+ characters, and arrives in every delivery for us to check.
 */
export async function createAbacatePayWebhook({
  apiKey,
  name,
  endpoint,
  secret,
  events,
}: {
  apiKey: string;
  name: string;
  endpoint: string;
  secret: string;
  events: string[];
}): Promise<{ id: string }> {
  const { data } = await callAbacatePay(apiKey, 'POST', '/webhooks/create', {
    name,
    endpoint,
    secret,
    events,
  });
  const webhook = AbacatePayWebhookSchema.parse(data);
  return { id: webhook.id };
}
