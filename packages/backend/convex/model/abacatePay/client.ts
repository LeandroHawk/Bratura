import { httpAnswerError } from '../../lib/httpError';
import {
  AbacatePayCustomerSchema,
  AbacatePayEnvelopeSchema,
  AbacatePayPlanChangeSchema,
  AbacatePayProductSchema,
  AbacatePayStoreSchema,
  AbacatePaySubscriptionCheckoutSchema,
  AbacatePayWebhookSchema,
} from './payload';

const abacatePayTimeoutMs = 15_000;
const abacatePayBaseUrl = 'https://api.abacatepay.com/v2';

/**
 * A non-2xx AbacatePay answer, or a 2xx whose envelope carries `error`: `status` is what a
 * caller reads to tell "not found" (404) or a bad key (401) from anything else. The body excerpt
 * stays in the error text for the logs, never for a table (`lib/httpError.ts`).
 */
export class AbacatePayAnswerError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(`AbacatePay answered HTTP ${status}${message ? `: ${message}` : ''}`);
    this.name = 'AbacatePayAnswerError';
  }
}

/**
 * Calls one API route: Bearer auth, JSON, timeout on every call. A 2xx hands back the envelope's
 * `data`; a non-2xx or an envelope carrying `error` throws `AbacatePayAnswerError`, while no
 * answer at all (timeout, network) throws the `fetch` error itself.
 */
async function callAbacatePay(
  apiKey: string,
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>,
): Promise<unknown> {
  const response = await fetch(`${abacatePayBaseUrl}${path}`, {
    method,
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(abacatePayTimeoutMs),
  });
  if (!response.ok) {
    const answer = await httpAnswerError('AbacatePay', response);
    throw new AbacatePayAnswerError(response.status, answer.message.split(': ', 2)[1] ?? '');
  }
  const envelope = AbacatePayEnvelopeSchema.safeParse(await response.json().catch(() => null));
  if (envelope.success && envelope.data.error) {
    throw new AbacatePayAnswerError(response.status, envelope.data.error);
  }
  return envelope.success ? envelope.data.data : undefined;
}

/** `GET /stores/get`: proves an api key answers and names the store; writes nothing. */
export async function fetchAbacatePayStore({
  apiKey,
}: {
  apiKey: string;
}): Promise<{ id: string; name: string }> {
  const store = AbacatePayStoreSchema.parse(await callAbacatePay(apiKey, 'GET', '/stores/get'));
  return { id: store.id, name: store.name };
}

/** `GET /products/get?externalId=…`: the product's id, `null` when the store does not have it. */
export async function findAbacatePayProduct({
  apiKey,
  externalId,
}: {
  apiKey: string;
  externalId: string;
}): Promise<{ id: string } | null> {
  try {
    const product = AbacatePayProductSchema.parse(
      await callAbacatePay(
        apiKey,
        'GET',
        `/products/get?externalId=${encodeURIComponent(externalId)}`,
      ),
    );
    return { id: product.id };
  } catch (error) {
    if (error instanceof AbacatePayAnswerError && error.status === 404) return null;
    throw error;
  }
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
  const product = AbacatePayProductSchema.parse(
    await callAbacatePay(apiKey, 'POST', '/products/create', {
      externalId,
      name,
      price: priceInCents,
      currency: 'BRL',
      cycle,
      ...(trialDays === undefined ? {} : { trialDays }),
    }),
  );
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
  const customer = AbacatePayCustomerSchema.parse(
    await callAbacatePay(apiKey, 'POST', '/customers/create', {
      email,
      ...(name === undefined ? {} : { name }),
      ...(taxId === undefined ? {} : { taxId }),
      ...(cellphone === undefined ? {} : { cellphone }),
    }),
  );
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
  const checkout = AbacatePaySubscriptionCheckoutSchema.parse(
    await callAbacatePay(apiKey, 'POST', '/subscriptions/create', {
      items: [{ id: productId, quantity }],
      customerId,
      externalId,
      methods,
      retryPolicy: { maxRetry: 3, retryEvery: 2 },
      ...(completionUrl === undefined ? {} : { completionUrl }),
    }),
  );
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
  const change = AbacatePayPlanChangeSchema.parse(
    await callAbacatePay(apiKey, 'POST', '/subscriptions/change-plan', {
      id: subscriptionId,
      productId,
      quantity,
    }),
  );
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
  const webhook = AbacatePayWebhookSchema.parse(
    await callAbacatePay(apiKey, 'POST', '/webhooks/create', {
      name,
      endpoint,
      secret,
      events,
    }),
  );
  return { id: webhook.id };
}
