import { convexTest } from 'convex-test';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { Id } from './_generated/dataModel';
import { internal } from './_generated/api';
import schema from './schema';
import { modules } from './test.setup';

const abacatePayWebhookPublicKey =
  't9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9';
const webhookSecret = 'f72179170ec5a0c845c0fcd18457e241006d09363b2d2a7d296d7bffbcd027c4';
const utf8 = new TextEncoder();
const base64Digits = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const toBase64 = (bytes: Uint8Array): string => {
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const triple =
      (bytes[index]! << 16) | ((bytes[index + 1] ?? 0) << 8) | (bytes[index + 2] ?? 0);
    output += base64Digits[(triple >> 18) & 63];
    output += base64Digits[(triple >> 12) & 63];
    output += index + 1 < bytes.length ? base64Digits[(triple >> 6) & 63] : '=';
    output += index + 2 < bytes.length ? base64Digits[triple & 63] : '=';
  }
  return output;
};

const sign = async (body: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    utf8.encode(abacatePayWebhookPublicKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return toBase64(new Uint8Array(await crypto.subtle.sign('HMAC', key, utf8.encode(body))));
};

const organizationIdOf = async (t: ReturnType<typeof convexTest>) =>
  await t.mutation(internal.organizations.createOrganization, {
    slug: 'demo-assoc',
    name: 'Associação Demo',
  });

const pendingSubscriptionArgs = (organizationId: Id<'organizations'>) => ({
  organizationId,
  abacatePayCheckoutId: 'bill_checkout1',
  checkoutUrl: 'https://app.abacatepay.com/pay/bill_checkout1',
  abacatePayCustomerId: 'cust_customer1',
  managedProfiles: 3,
  devMode: true,
});

const pendingSubscriptionOf = async (
  t: ReturnType<typeof convexTest>,
  organizationId: Id<'organizations'>,
) =>
  await t.mutation(
    internal.billing.recordPendingSubscription,
    pendingSubscriptionArgs(organizationId),
  );

const deliveryArgs = (overrides: Partial<Record<string, unknown>> = {}) => ({
  deliveryId: 'log_delivery1',
  event: 'subscription.completed',
  devMode: true,
  abacatePaySubscriptionId: 'subs_sub1',
  abacatePayCheckoutId: 'bill_checkout1',
  amountInCents: 8970,
  method: 'CARD' as const,
  pendingUpdateId: null,
  cancelledDueTo: null,
  ...overrides,
});

const recordAndProcess = async (
  t: ReturnType<typeof convexTest>,
  overrides: Partial<Record<string, unknown>> = {},
) => {
  const record = await t.mutation(internal.billing.recordAbacatePayDelivery, deliveryArgs(overrides));
  if (record.outcome === 'stored') {
    await t.mutation(internal.billing.processAbacatePayDelivery, {
      billingWebhookDeliveryId: record.billingWebhookDeliveryId,
    });
  }
  return record;
};

const subscriptionOf = async (t: ReturnType<typeof convexTest>, id: Id<'billingSubscriptions'>) =>
  await t.run((ctx) => ctx.db.get(id));

const deliveryRowOf = async (t: ReturnType<typeof convexTest>, id: Id<'billingWebhookDeliveries'>) =>
  await t.run((ctx) => ctx.db.get(id));

describe('recordPendingSubscription', () => {
  test('inserts one pending row per organization, and only one open row', async () => {
    const t = convexTest(schema, modules);
    const organizationId = await organizationIdOf(t);
    const first = await pendingSubscriptionOf(t, organizationId);
    const same = await pendingSubscriptionOf(t, organizationId);
    expect(same).toBe(first);
    await expect(
      t.mutation(internal.billing.recordPendingSubscription, {
        ...pendingSubscriptionArgs(organizationId),
        abacatePayCheckoutId: 'bill_other',
      }),
    ).rejects.toThrow(/conflict/);
  });
});

describe('recordAbacatePayDelivery', () => {
  test('stores a delivery once per provider log id', async () => {
    const t = convexTest(schema, modules);
    const first = await t.mutation(internal.billing.recordAbacatePayDelivery, deliveryArgs());
    const again = await t.mutation(internal.billing.recordAbacatePayDelivery, deliveryArgs());
    expect(first.outcome).toBe('stored');
    expect(again).toEqual({ outcome: 'duplicate' });
    const rows = await t.run((ctx) => ctx.db.query('billingWebhookDeliveries').collect());
    expect(rows).toHaveLength(1);
  });
});

describe('processAbacatePayDelivery', () => {
  test('a completed checkout turns the pending row active', async () => {
    const t = convexTest(schema, modules);
    const organizationId = await organizationIdOf(t);
    const id = await pendingSubscriptionOf(t, organizationId);
    const record = await recordAndProcess(t);
    const row = await subscriptionOf(t, id);
    expect(row).toMatchObject({
      status: 'active',
      abacatePaySubscriptionId: 'subs_sub1',
      method: 'CARD',
      amountInCents: 8970,
      lastPaymentFailedAt: null,
    });
    const delivery = await deliveryRowOf(
      t,
      (record as { billingWebhookDeliveryId: Id<'billingWebhookDeliveries'> })
        .billingWebhookDeliveryId,
    );
    expect(delivery).toMatchObject({ outcome: 'applied', billingSubscriptionId: id });
  });

  test('a renewal refreshes amount and the failed mark clears', async () => {
    const t = convexTest(schema, modules);
    const organizationId = await organizationIdOf(t);
    const id = await pendingSubscriptionOf(t, organizationId);
    await recordAndProcess(t);
    await recordAndProcess(t, {
      deliveryId: 'log_fail',
      event: 'subscription.payment_failed',
      amountInCents: null,
      method: null,
    });
    let row = await subscriptionOf(t, id);
    expect(row?.lastPaymentFailedAt).not.toBeNull();
    await recordAndProcess(t, {
      deliveryId: 'log_renew',
      event: 'subscription.renewed',
      amountInCents: 8970,
    });
    row = await subscriptionOf(t, id);
    expect(row).toMatchObject({ status: 'active', amountInCents: 8970, lastPaymentFailedAt: null });
    expect(row?.lastRenewedAt).not.toBeNull();
  });

  test('cancelled is terminal: a late completed is superseded', async () => {
    const t = convexTest(schema, modules);
    const organizationId = await organizationIdOf(t);
    const id = await pendingSubscriptionOf(t, organizationId);
    await recordAndProcess(t);
    await recordAndProcess(t, {
      deliveryId: 'log_cancel',
      event: 'subscription.cancelled',
      cancelledDueTo: 'max_payment_retries_exceeded',
    });
    expect(await subscriptionOf(t, id)).toMatchObject({
      status: 'cancelled',
      cancelledDueTo: 'max_payment_retries_exceeded',
    });
    const late = await recordAndProcess(t, { deliveryId: 'log_late' });
    const lateDelivery = await deliveryRowOf(
      t,
      (late as { billingWebhookDeliveryId: Id<'billingWebhookDeliveries'> })
        .billingWebhookDeliveryId,
    );
    expect(lateDelivery?.outcome).toBe('superseded');
    expect((await subscriptionOf(t, id))?.status).toBe('cancelled');
  });

  test('an applied plan change moves the pending quantity into place', async () => {
    const t = convexTest(schema, modules);
    const organizationId = await organizationIdOf(t);
    const id = await pendingSubscriptionOf(t, organizationId);
    await recordAndProcess(t);
    await t.mutation(internal.billing.recordPlanChange, {
      billingSubscriptionId: id,
      managedProfiles: 10,
    });
    // The request event carries pendingUpdateId: quantity stays until applied.
    await recordAndProcess(t, {
      deliveryId: 'log_plan_pending',
      event: 'subscription.plan_changed',
      pendingUpdateId: 'subu_pending1',
    });
    let row = await subscriptionOf(t, id);
    expect(row).toMatchObject({ managedProfiles: 3, pendingManagedProfiles: 10 });
    // The applied event carries no pendingUpdateId and the new amount.
    await recordAndProcess(t, {
      deliveryId: 'log_plan_applied',
      event: 'subscription.plan_changed',
      amountInCents: 29900,
    });
    row = await subscriptionOf(t, id);
    expect(row).toMatchObject({
      managedProfiles: 10,
      pendingManagedProfiles: null,
      amountInCents: 29900,
    });
  });

  test('an event naming no row is unmatched; a non-subscription event is ignored', async () => {
    const t = convexTest(schema, modules);
    const unmatched = await recordAndProcess(t, { deliveryId: 'log_orphan' });
    expect(
      (
        await deliveryRowOf(
          t,
          (unmatched as { billingWebhookDeliveryId: Id<'billingWebhookDeliveries'> })
            .billingWebhookDeliveryId,
        )
      )?.outcome,
    ).toBe('unmatchedSubscription');
    const other = await recordAndProcess(t, {
      deliveryId: 'log_payout',
      event: 'payout.completed',
    });
    expect(
      (
        await deliveryRowOf(
          t,
          (other as { billingWebhookDeliveryId: Id<'billingWebhookDeliveries'> })
            .billingWebhookDeliveryId,
        )
      )?.outcome,
    ).toBe('ignored');
  });

  test('processing the same delivery twice stays applied once', async () => {
    const t = convexTest(schema, modules);
    const organizationId = await organizationIdOf(t);
    const id = await pendingSubscriptionOf(t, organizationId);
    const record = await t.mutation(internal.billing.recordAbacatePayDelivery, deliveryArgs());
    const deliveryId = (record as { billingWebhookDeliveryId: Id<'billingWebhookDeliveries'> })
      .billingWebhookDeliveryId;
    await t.mutation(internal.billing.processAbacatePayDelivery, {
      billingWebhookDeliveryId: deliveryId,
    });
    const processedAt = (await deliveryRowOf(t, deliveryId))?.processedAt;
    await t.mutation(internal.billing.processAbacatePayDelivery, {
      billingWebhookDeliveryId: deliveryId,
    });
    expect((await deliveryRowOf(t, deliveryId))?.processedAt).toBe(processedAt);
    expect((await subscriptionOf(t, id))?.status).toBe('active');
  });
});

describe('markSubscriptionCancelled', () => {
  test('ends an active row with our own reason', async () => {
    const t = convexTest(schema, modules);
    const organizationId = await organizationIdOf(t);
    const id = await pendingSubscriptionOf(t, organizationId);
    await recordAndProcess(t);
    await t.mutation(internal.billing.markSubscriptionCancelled, {
      billingSubscriptionId: id,
      cancelledDueTo: 'cancelledByBratura',
    });
    expect(await subscriptionOf(t, id)).toMatchObject({
      status: 'cancelled',
      abacatePaySubscriptionId: 'subs_sub1',
      cancelledDueTo: 'cancelledByBratura',
    });
  });
});

describe('abacatePayWebhook', () => {
  const post = async (
    t: ReturnType<typeof convexTest>,
    body: string,
    headers: Record<string, string>,
  ) =>
    await t.fetch('/abacatepay/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body,
    });

  test('rejects a delivery without the secret or with a bad signature', async () => {
    vi.stubEnv('ABACATE_PAY_WEBHOOK_SECRET', webhookSecret);
    const t = convexTest(schema, modules);
    const body = JSON.stringify({ id: 'log_web1', event: 'subscription.completed', data: {} });
    expect((await post(t, body, {})).status).toBe(401);
    expect(
      (await post(t, body, { 'x-webhook-secret': webhookSecret })).status,
    ).toBe(401);
    vi.unstubAllEnvs();
  });

  test('rejects a signed but malformed body with 400', async () => {
    vi.stubEnv('ABACATE_PAY_WEBHOOK_SECRET', webhookSecret);
    const t = convexTest(schema, modules);
    const body = 'not json at all';
    const signature = await sign(body);
    const response = await post(t, body, {
      'x-webhook-secret': webhookSecret,
      'x-webhook-signature': signature,
    });
    expect(response.status).toBe(400);
    vi.unstubAllEnvs();
  });

  test('accepts a signed delivery, stores it, and applies it to the subscription', async () => {
    vi.stubEnv('ABACATE_PAY_WEBHOOK_SECRET', webhookSecret);
    const t = convexTest(schema, modules);
    const organizationId = await organizationIdOf(t);
    const id = await pendingSubscriptionOf(t, organizationId);
    const body = JSON.stringify({
      id: 'log_web2',
      event: 'subscription.completed',
      apiVersion: 2,
      devMode: true,
      data: {
        subscription: { id: 'subs_sub1', amount: 8970, method: 'CARD', status: 'ACTIVE' },
        checkout: { id: 'bill_checkout1' },
      },
    });
    const signature = await sign(body);
    const response = await post(t, body, {
      'x-webhook-secret': webhookSecret,
      'x-webhook-signature': signature,
    });
    expect(response.status).toBe(200);
    // The http action schedules the processing with runAfter(0): the real timer has to fire
    // before the job exists for `finishInProgressScheduledFunctions` to wait on.
    await new Promise((resolve) => setTimeout(resolve, 20));
    await t.finishInProgressScheduledFunctions();
    expect(await subscriptionOf(t, id)).toMatchObject({
      status: 'active',
      abacatePaySubscriptionId: 'subs_sub1',
    });
    vi.unstubAllEnvs();
  });
});

describe('openPanelCheckout', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  const abacatePayAnswers = () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.endsWith('/customers/create')) {
        return new Response(JSON.stringify({ data: { id: 'cust_customer1' } }), { status: 200 });
      }
      if (url.endsWith('/subscriptions/create')) {
        return new Response(
          JSON.stringify({
            data: {
              id: 'bill_checkout1',
              url: 'https://app.abacatepay.com/pay/bill_checkout1',
              devMode: true,
            },
          }),
          { status: 200 },
        );
      }
      return new Response('not found', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  };

  test('opens the checkout, records the pending row, and reuses it on a repeat', async () => {
    vi.stubEnv('ABACATE_PAY_API_KEY', 'abc_dev_key');
    vi.stubEnv('ABACATE_PAY_PRODUCT_ID', 'prod_panel');
    const t = convexTest(schema, modules);
    const organizationId = await organizationIdOf(t);
    const fetchMock = abacatePayAnswers();
    const opened = await t.action(internal.billing.openPanelCheckout, {
      organizationId,
      managedProfiles: 3,
      customerEmail: 'tesouraria@assoc.example.br',
    });
    expect(opened.reusedPendingCheckout).toBe(false);
    expect(opened.checkoutUrl).toBe('https://app.abacatepay.com/pay/bill_checkout1');
    const checkoutBody: unknown = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(checkoutBody).toMatchObject({
      items: [{ id: 'prod_panel', quantity: 3 }],
      customerId: 'cust_customer1',
      externalId: `org-${organizationId}`,
      methods: ['CARD'],
    });
    expect(await subscriptionOf(t, opened.billingSubscriptionId)).toMatchObject({
      status: 'pending',
      managedProfiles: 3,
      devMode: true,
    });
    const calls = fetchMock.mock.calls.length;
    const again = await t.action(internal.billing.openPanelCheckout, {
      organizationId,
      managedProfiles: 5,
      customerEmail: 'tesouraria@assoc.example.br',
    });
    expect(again).toMatchObject({ reusedPendingCheckout: true, checkoutUrl: opened.checkoutUrl });
    expect(fetchMock.mock.calls.length).toBe(calls);
  });
});
