import { convexTest } from 'convex-test';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { Id } from './_generated/dataModel';
import { internal } from './_generated/api';
import { abacatePayWebhookPublicKey } from './model/abacatePay/signature';
import schema from './schema';
import { modules } from './test.setup';

const webhookSecret = 'test-webhook-secret';
const utf8 = new TextEncoder();

const sign = async (body: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    utf8.encode(abacatePayWebhookPublicKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return btoa(
    String.fromCharCode(
      ...new Uint8Array(await crypto.subtle.sign('HMAC', key, utf8.encode(body))),
    ),
  );
};

/** Narrows `recordAbacatePayDelivery`'s union: the tests only ever need the stored branch. */
const storedDeliveryId = (
  record:
    | { outcome: 'stored'; billingWebhookDeliveryId: Id<'billingWebhookDeliveries'> }
    | {
        outcome: 'duplicate';
      },
): Id<'billingWebhookDeliveries'> => {
  if (record.outcome !== 'stored') throw new Error('the delivery was not stored');
  return record.billingWebhookDeliveryId;
};

const organizationIdOf = async (t: ReturnType<typeof convexTest>) =>
  await t.mutation(internal.organizations.createOrganization, {
    slug: 'demo-assoc',
    name: 'Associação Demo',
  });

const pendingSubscriptionArgs = (
  organizationId: Id<'organizations'>,
  overrides: Partial<Record<string, unknown>> = {},
) => ({
  organizationId,
  abacatePayCheckoutId: 'bill_checkout1',
  checkoutUrl: 'https://app.abacatepay.com/pay/bill_checkout1',
  abacatePayCustomerId: 'cust_customer1',
  managedProfiles: 3,
  devMode: true,
  ...overrides,
});

const pendingSubscriptionOf = async (
  t: ReturnType<typeof convexTest>,
  organizationId: Id<'organizations'>,
  overrides: Partial<Record<string, unknown>> = {},
) =>
  await t.mutation(
    internal.billing.recordPendingSubscription,
    pendingSubscriptionArgs(organizationId, overrides),
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
  planChangeStatus: null,
  quantity: null,
  newAmountInCents: null,
  cancelledDueTo: null,
  ...overrides,
});

const recordAndProcess = async (
  t: ReturnType<typeof convexTest>,
  overrides: Partial<Record<string, unknown>> = {},
) => {
  const record = await t.mutation(
    internal.billing.recordAbacatePayDelivery,
    deliveryArgs(overrides),
  );
  if (record.outcome === 'stored') {
    await t.mutation(internal.billing.processAbacatePayDelivery, {
      billingWebhookDeliveryId: record.billingWebhookDeliveryId,
    });
  }
  return record;
};

const subscriptionOf = async (t: ReturnType<typeof convexTest>, id: Id<'billingSubscriptions'>) =>
  await t.run((ctx) => ctx.db.get(id));

const deliveryRowOf = async (
  t: ReturnType<typeof convexTest>,
  id: Id<'billingWebhookDeliveries'>,
) => await t.run((ctx) => ctx.db.get(id));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

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

  test('a bill_ a cancelled row owns is a conflict — it can never open twice', async () => {
    const t = convexTest(schema, modules);
    const organizationId = await organizationIdOf(t);
    const id = await pendingSubscriptionOf(t, organizationId);
    await t.mutation(internal.billing.markSubscriptionCancelled, {
      billingSubscriptionId: id,
      cancelledDueTo: 'cancelledByBratura',
    });
    await expect(
      t.mutation(
        internal.billing.recordPendingSubscription,
        pendingSubscriptionArgs(organizationId),
      ),
    ).rejects.toThrow(/conflict/);
    const fresh = await pendingSubscriptionOf(t, organizationId, {
      abacatePayCheckoutId: 'bill_checkout2',
      checkoutUrl: 'https://app.abacatepay.com/pay/bill_checkout2',
    });
    expect(fresh).not.toBe(id);
    expect((await subscriptionOf(t, fresh))?.status).toBe('pending');
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
    const delivery = await deliveryRowOf(t, storedDeliveryId(record));
    expect(delivery).toMatchObject({ outcome: 'applied', billingSubscriptionId: id });
  });

  test('a trial that started also activates the pending row', async () => {
    const t = convexTest(schema, modules);
    const organizationId = await organizationIdOf(t);
    const id = await pendingSubscriptionOf(t, organizationId);
    await recordAndProcess(t, { event: 'subscription.trial_started', amountInCents: null });
    expect(await subscriptionOf(t, id)).toMatchObject({
      status: 'active',
      abacatePaySubscriptionId: 'subs_sub1',
    });
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
      cancelledDueTo: 'maxPaymentRetriesExceeded',
    });
    expect(await subscriptionOf(t, id)).toMatchObject({
      status: 'cancelled',
      cancelledDueTo: 'maxPaymentRetriesExceeded',
    });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const late = await recordAndProcess(t, { deliveryId: 'log_late' });
    const lateDelivery = await deliveryRowOf(t, storedDeliveryId(late));
    expect(lateDelivery?.outcome).toBe('superseded');
    expect((await subscriptionOf(t, id))?.status).toBe('cancelled');
    // A charge on a closed row means the provider billed a panel that is off: the log warns
    // with the delivery id and the subs_ so someone can refund on the provider's dashboard.
    expect(error).toHaveBeenCalledWith(expect.stringContaining('log_late'), 'subs_sub1');
    error.mockRestore();
  });

  test("a provider's cancelled landing after our own cancel keeps the row", async () => {
    const t = convexTest(schema, modules);
    const organizationId = await organizationIdOf(t);
    const id = await pendingSubscriptionOf(t, organizationId);
    await recordAndProcess(t);
    // Our own cancel lands first, the provider's event right behind — the live sequence.
    await t.mutation(internal.billing.markSubscriptionCancelled, {
      billingSubscriptionId: id,
      cancelledDueTo: 'cancelledByBratura',
    });
    const late = await recordAndProcess(t, {
      deliveryId: 'log_cancel_echo',
      event: 'subscription.cancelled',
    });
    const lateDelivery = await deliveryRowOf(t, storedDeliveryId(late));
    expect(lateDelivery?.outcome).toBe('superseded');
    expect(await subscriptionOf(t, id)).toMatchObject({
      status: 'cancelled',
      activatedAt: expect.any(Number),
      cancelledDueTo: 'cancelledByBratura',
    });
  });

  test('a pending plan change records the asked quantity; the applied one moves it', async () => {
    const t = convexTest(schema, modules);
    const organizationId = await organizationIdOf(t);
    const id = await pendingSubscriptionOf(t, organizationId);
    await recordAndProcess(t);
    // The request event — status PENDING, the asked quantity in `data.quantity`.
    await recordAndProcess(t, {
      deliveryId: 'log_plan_pending',
      event: 'subscription.plan_changed',
      pendingUpdateId: 'subu_pending1',
      planChangeStatus: 'PENDING',
      quantity: 10,
      newAmountInCents: 29900,
    });
    let row = await subscriptionOf(t, id);
    expect(row).toMatchObject({ managedProfiles: 3, pendingManagedProfiles: 10 });
    // The applied event — no request fields, the new cycle charge in `subscription.amount`.
    await recordAndProcess(t, {
      deliveryId: 'log_plan_applied',
      event: 'subscription.plan_changed',
      amountInCents: 29900,
      quantity: 10,
    });
    row = await subscriptionOf(t, id);
    expect(row).toMatchObject({
      managedProfiles: 10,
      pendingManagedProfiles: null,
      amountInCents: 29900,
    });
  });

  test('an applied plan change with nothing pending keeps the quantity, moves the amount', async () => {
    const t = convexTest(schema, modules);
    const organizationId = await organizationIdOf(t);
    const id = await pendingSubscriptionOf(t, organizationId);
    await recordAndProcess(t);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // The docs' applied example: no `quantity`, no `status`, and the checkout still carries
    // the original item — the event says nothing about the new quantity.
    await recordAndProcess(t, {
      deliveryId: 'log_plan_dashboard',
      event: 'subscription.plan_changed',
      quantity: null,
      amountInCents: 20930,
    });
    expect(await subscriptionOf(t, id)).toMatchObject({
      managedProfiles: 3,
      amountInCents: 20930,
    });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('log_plan_dashboard'), 'subs_sub1');
    warn.mockRestore();
  });

  test('an event naming no row is unmatched; a non-subscription event is ignored', async () => {
    const t = convexTest(schema, modules);
    const unmatched = await recordAndProcess(t, { deliveryId: 'log_orphan' });
    expect((await deliveryRowOf(t, storedDeliveryId(unmatched)))?.outcome).toBe(
      'unmatchedSubscription',
    );
    const other = await recordAndProcess(t, {
      deliveryId: 'log_payout',
      event: 'payout.completed',
    });
    expect((await deliveryRowOf(t, storedDeliveryId(other)))?.outcome).toBe('ignored');
  });

  test('processing the same delivery twice stays applied once', async () => {
    const t = convexTest(schema, modules);
    const organizationId = await organizationIdOf(t);
    const id = await pendingSubscriptionOf(t, organizationId);
    const record = await t.mutation(internal.billing.recordAbacatePayDelivery, deliveryArgs());
    const deliveryId = storedDeliveryId(record);
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

  test('reprocessUnprocessedDeliveries applies a delivery a run left behind', async () => {
    const t = convexTest(schema, modules);
    const organizationId = await organizationIdOf(t);
    const id = await pendingSubscriptionOf(t, organizationId);
    await t.mutation(internal.billing.recordAbacatePayDelivery, deliveryArgs());
    const result = await t.mutation(internal.billing.reprocessUnprocessedDeliveries, {});
    expect(result).toEqual({ reprocessed: 1, hasMore: false });
    expect(await subscriptionOf(t, id)).toMatchObject({ status: 'active' });
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

describe('cancelPanelSubscription', () => {
  const abacatePayAnswers = (map: Record<string, unknown>) =>
    vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      for (const [path, answer] of Object.entries(map)) {
        if (url.endsWith(path)) {
          return new Response(JSON.stringify(answer), { status: 200 });
        }
      }
      return new Response('not found', { status: 404 });
    });

  test('cancels an active subscription on the provider, then on our row', async () => {
    vi.stubEnv('ABACATE_PAY_API_KEY', 'abc_dev_key');
    const t = convexTest(schema, modules);
    const organizationId = await organizationIdOf(t);
    const id = await pendingSubscriptionOf(t, organizationId);
    await recordAndProcess(t);
    const fetchMock = abacatePayAnswers({ '/subscriptions/cancel': { data: {} } });
    vi.stubGlobal('fetch', fetchMock);
    await t.action(internal.billing.cancelPanelSubscription, { organizationId });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.abacatepay.com/v2/subscriptions/cancel',
      expect.objectContaining({
        body: JSON.stringify({ id: 'subs_sub1' }),
      }),
    );
    expect(await subscriptionOf(t, id)).toMatchObject({
      status: 'cancelled',
      cancelledDueTo: 'cancelledByBratura',
    });
  });

  test('deletes a pending checkout on the provider, giving it a way out', async () => {
    vi.stubEnv('ABACATE_PAY_API_KEY', 'abc_dev_key');
    const t = convexTest(schema, modules);
    const organizationId = await organizationIdOf(t);
    const id = await pendingSubscriptionOf(t, organizationId);
    const fetchMock = abacatePayAnswers({ '?id=bill_checkout1': { data: {} } });
    vi.stubGlobal('fetch', fetchMock);
    await t.action(internal.billing.cancelPanelSubscription, { organizationId });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.abacatepay.com/v2/subscriptions/checkouts/delete?id=bill_checkout1',
      expect.anything(),
    );
    expect(await subscriptionOf(t, id)).toMatchObject({
      status: 'cancelled',
      abacatePaySubscriptionId: null,
      cancelledDueTo: 'cancelledByBratura',
    });
    // And a fresh checkout can open afterwards.
    const fresh = await pendingSubscriptionOf(t, organizationId, {
      abacatePayCheckoutId: 'bill_checkout2',
      checkoutUrl: 'https://app.abacatepay.com/pay/bill_checkout2',
    });
    expect(fresh).not.toBe(id);
  });
});

describe('changeManagedProfiles', () => {
  const abacatePayAnswers = (map: Record<string, { status: number; body: unknown }>) =>
    vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      for (const [path, answer] of Object.entries(map)) {
        if (url.endsWith(path)) {
          return new Response(JSON.stringify(answer.body), { status: answer.status });
        }
      }
      return new Response('not found', { status: 404 });
    });

  test('schedules the new quantity: it waits in pendingManagedProfiles', async () => {
    vi.stubEnv('ABACATE_PAY_API_KEY', 'abc_dev_key');
    vi.stubEnv('ABACATE_PAY_PRODUCT_ID', 'prod_panel');
    const t = convexTest(schema, modules);
    const organizationId = await organizationIdOf(t);
    const id = await pendingSubscriptionOf(t, organizationId);
    await recordAndProcess(t);
    const fetchMock = abacatePayAnswers({
      '/subscriptions/change-plan': {
        status: 200,
        body: { data: { id: 'subu_update1', newAmount: 14950 } },
      },
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await t.action(internal.billing.changeManagedProfiles, {
      organizationId,
      managedProfiles: 5,
    });
    expect(result.updateId).toBe('subu_update1');
    expect(await subscriptionOf(t, id)).toMatchObject({
      managedProfiles: 3,
      pendingManagedProfiles: 5,
    });
  });

  test('a provider failure reaches the caller as unavailable, never as provider text', async () => {
    vi.stubEnv('ABACATE_PAY_API_KEY', 'abc_dev_key');
    vi.stubEnv('ABACATE_PAY_PRODUCT_ID', 'prod_panel');
    const t = convexTest(schema, modules);
    const organizationId = await organizationIdOf(t);
    await pendingSubscriptionOf(t, organizationId);
    await recordAndProcess(t);
    vi.stubGlobal(
      'fetch',
      abacatePayAnswers({
        '/subscriptions/change-plan': {
          status: 422,
          body: { error: 'Não é possível alterar uma assinatura PIX' },
        },
      }),
    );
    await expect(
      t.action(internal.billing.changeManagedProfiles, { organizationId, managedProfiles: 5 }),
    ).rejects.toMatchObject({ data: { code: 'unavailable' } });
  });
});

describe('openPanelCheckout', () => {
  const abacatePayAnswers = (checkoutId = 'bill_checkout1') => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.endsWith('/customers/create')) {
        return new Response(JSON.stringify({ data: { id: 'cust_customer1' } }), { status: 200 });
      }
      if (url.endsWith('/subscriptions/create')) {
        return new Response(
          JSON.stringify({
            data: {
              id: checkoutId,
              url: `https://app.abacatepay.com/pay/${checkoutId}`,
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

  const openArgs = (organizationId: Id<'organizations'>, managedProfiles = 3) => ({
    organizationId,
    managedProfiles,
    customerEmail: 'tesouraria@assoc.example.br',
  });

  test('opens the checkout, records the pending row, and reuses it on a repeat', async () => {
    vi.stubEnv('ABACATE_PAY_API_KEY', 'abc_dev_key');
    vi.stubEnv('ABACATE_PAY_PRODUCT_ID', 'prod_panel');
    const t = convexTest(schema, modules);
    const organizationId = await organizationIdOf(t);
    const fetchMock = abacatePayAnswers();
    const opened = await t.action(internal.billing.openPanelCheckout, openArgs(organizationId));
    expect(opened.reusedPendingCheckout).toBe(false);
    expect(opened.checkoutUrl).toBe('https://app.abacatepay.com/pay/bill_checkout1');
    const checkoutBody: unknown = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(checkoutBody).toMatchObject({
      items: [{ id: 'prod_panel', quantity: 3 }],
      customerId: 'cust_customer1',
      externalId: `org-${organizationId}-1`,
      methods: ['CARD'],
    });
    expect(await subscriptionOf(t, opened.billingSubscriptionId)).toMatchObject({
      status: 'pending',
      managedProfiles: 3,
      devMode: true,
    });
    const calls = fetchMock.mock.calls.length;
    const again = await t.action(internal.billing.openPanelCheckout, openArgs(organizationId, 5));
    expect(again).toMatchObject({ reusedPendingCheckout: true, checkoutUrl: opened.checkoutUrl });
    expect(fetchMock.mock.calls.length).toBe(calls);
  });

  test('a 2xx whose data fails the shape reaches the caller as unavailable', async () => {
    vi.stubEnv('ABACATE_PAY_API_KEY', 'abc_dev_key');
    vi.stubEnv('ABACATE_PAY_PRODUCT_ID', 'prod_panel');
    const t = convexTest(schema, modules);
    const organizationId = await organizationIdOf(t);
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () =>
        Promise.resolve(new Response(JSON.stringify({ data: { id: 1 } }), { status: 200 })),
      ),
    );
    await expect(
      t.action(internal.billing.openPanelCheckout, openArgs(organizationId)),
    ).rejects.toMatchObject({ data: { code: 'unavailable' } });
  });

  test('reopening after a cancel asks for a fresh externalId, never the dead bill_', async () => {
    vi.stubEnv('ABACATE_PAY_API_KEY', 'abc_dev_key');
    vi.stubEnv('ABACATE_PAY_PRODUCT_ID', 'prod_panel');
    const t = convexTest(schema, modules);
    const organizationId = await organizationIdOf(t);
    const fetchMock = abacatePayAnswers('bill_checkout2');
    // Seed the cancelled first attempt directly.
    await pendingSubscriptionOf(t, organizationId);
    const state = await t.query(internal.billing.getPanelBillingState, { organizationId });
    await t.mutation(internal.billing.markSubscriptionCancelled, {
      billingSubscriptionId: state.open!.billingSubscriptionId,
      cancelledDueTo: 'cancelledByBratura',
    });
    const reopened = await t.action(internal.billing.openPanelCheckout, openArgs(organizationId));
    const checkoutBody: unknown = JSON.parse(
      String(fetchMock.mock.calls[fetchMock.mock.calls.length - 1]?.[1]?.body),
    );
    expect(checkoutBody).toMatchObject({ externalId: `org-${organizationId}-2` });
    const row = await subscriptionOf(t, reopened.billingSubscriptionId);
    expect(row).toMatchObject({ status: 'pending', abacatePayCheckoutId: 'bill_checkout2' });
  });
});

describe('abacatePayWebhook', () => {
  const post = async (
    t: ReturnType<typeof convexTest>,
    body: string,
    headers: Record<string, string>,
    query = '',
  ) =>
    await t.fetch(`/abacatepay/webhook${query}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body,
    });

  test('rejects a delivery without the secret or with a bad signature with 403', async () => {
    vi.stubEnv('ABACATE_PAY_WEBHOOK_SECRET', webhookSecret);
    const t = convexTest(schema, modules);
    const body = JSON.stringify({ id: 'log_web1', event: 'subscription.completed', data: {} });
    expect((await post(t, body, {})).status).toBe(403);
    expect((await post(t, body, { 'x-webhook-secret': webhookSecret })).status).toBe(403);
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
  });

  test('the secret also arrives through the webhookSecret URL parameter', async () => {
    vi.stubEnv('ABACATE_PAY_WEBHOOK_SECRET', webhookSecret);
    const t = convexTest(schema, modules);
    const body = JSON.stringify({
      id: 'log_web3',
      event: 'subscription.completed',
      devMode: true,
      data: {},
    });
    const signature = await sign(body);
    const response = await post(
      t,
      body,
      { 'x-webhook-signature': signature },
      `?webhookSecret=${webhookSecret}`,
    );
    expect(response.status).toBe(200);
  });

  test('a bad field no longer erases the event: an unknown method still cancels', async () => {
    vi.stubEnv('ABACATE_PAY_WEBHOOK_SECRET', webhookSecret);
    const t = convexTest(schema, modules);
    const organizationId = await organizationIdOf(t);
    const id = await pendingSubscriptionOf(t, organizationId);
    const body = JSON.stringify({
      id: 'log_web4',
      event: 'subscription.cancelled',
      devMode: true,
      data: {
        subscription: {
          id: 'subs_sub1',
          amount: 8970,
          method: 'VOUCHER',
          status: 'CANCELLED',
          cancelledDueTo: 'dispute_opened',
        },
        checkout: { id: 'bill_checkout1' },
      },
    });
    const signature = await sign(body);
    const response = await post(t, body, {
      'x-webhook-secret': webhookSecret,
      'x-webhook-signature': signature,
    });
    expect(response.status).toBe(200);
    await new Promise((resolve) => setTimeout(resolve, 20));
    await t.finishInProgressScheduledFunctions();
    const row = await subscriptionOf(t, id);
    expect(row).toMatchObject({ status: 'cancelled', cancelledDueTo: 'disputeOpened' });
    const delivery = await t.run((ctx) =>
      ctx.db
        .query('billingWebhookDeliveries')
        .withIndex('by_delivery', (index) => index.eq('deliveryId', 'log_web4'))
        .unique(),
    );
    expect(delivery?.method).toBeNull();
  });

  test('a payer-typed portal reason is mapped to the enum, never stored', async () => {
    vi.stubEnv('ABACATE_PAY_WEBHOOK_SECRET', webhookSecret);
    const t = convexTest(schema, modules);
    const organizationId = await organizationIdOf(t);
    const id = await pendingSubscriptionOf(t, organizationId);
    const portalText = `Cancelada pelo cliente no portal: ${'x'.repeat(600)}`;
    const body = JSON.stringify({
      id: 'log_web5',
      event: 'subscription.cancelled',
      devMode: true,
      data: {
        subscription: {
          id: 'subs_sub1',
          status: 'CANCELLED',
          cancelledDueTo: portalText,
        },
        checkout: { id: 'bill_checkout1' },
      },
    });
    const signature = await sign(body);
    const response = await post(t, body, {
      'x-webhook-secret': webhookSecret,
      'x-webhook-signature': signature,
    });
    expect(response.status).toBe(200);
    await new Promise((resolve) => setTimeout(resolve, 20));
    await t.finishInProgressScheduledFunctions();
    expect(await subscriptionOf(t, id)).toMatchObject({
      status: 'cancelled',
      cancelledDueTo: 'customerPortal',
    });
    const delivery = await t.run((ctx) =>
      ctx.db
        .query('billingWebhookDeliveries')
        .withIndex('by_delivery', (index) => index.eq('deliveryId', 'log_web5'))
        .unique(),
    );
    expect(delivery?.cancelledDueTo).toBe('customerPortal');
  });

  test('a delivery without any usable id is stored unparsed and answered 200', async () => {
    vi.stubEnv('ABACATE_PAY_WEBHOOK_SECRET', webhookSecret);
    const t = convexTest(schema, modules);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const body = JSON.stringify({
      id: 'log_web6',
      event: 'subscription.cancelled',
      devMode: true,
      data: { subscription: { id: 42 }, checkout: 'no-object' },
    });
    const signature = await sign(body);
    const response = await post(t, body, {
      'x-webhook-secret': webhookSecret,
      'x-webhook-signature': signature,
    });
    expect(response.status).toBe(200);
    const delivery = await t.run((ctx) =>
      ctx.db
        .query('billingWebhookDeliveries')
        .withIndex('by_delivery', (index) => index.eq('deliveryId', 'log_web6'))
        .unique(),
    );
    expect(delivery).toMatchObject({ outcome: 'unparsed', processedAt: expect.any(Number) });
    // The log says the event and which ids were present — never a value.
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('log_web6'), {
      subscriptionIdPresent: true,
      checkoutIdPresent: false,
    });
    warn.mockRestore();
  });

  test('an event that is not ours is stored ignored, silently, answered 200', async () => {
    vi.stubEnv('ABACATE_PAY_WEBHOOK_SECRET', webhookSecret);
    const t = convexTest(schema, modules);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const body = JSON.stringify({
      id: 'log_web7',
      event: 'payout.completed',
      devMode: true,
      data: {},
    });
    const signature = await sign(body);
    const response = await post(t, body, {
      'x-webhook-secret': webhookSecret,
      'x-webhook-signature': signature,
    });
    expect(response.status).toBe(200);
    const delivery = await t.run((ctx) =>
      ctx.db
        .query('billingWebhookDeliveries')
        .withIndex('by_delivery', (index) => index.eq('deliveryId', 'log_web7'))
        .unique(),
    );
    expect(delivery).toMatchObject({ outcome: 'ignored', processedAt: expect.any(Number) });
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  test('a signed subscription event without data is stored unparsed, answered 200', async () => {
    vi.stubEnv('ABACATE_PAY_WEBHOOK_SECRET', webhookSecret);
    const t = convexTest(schema, modules);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const body = JSON.stringify({ id: 'log_web8', event: 'subscription.cancelled', devMode: true });
    const signature = await sign(body);
    const response = await post(t, body, {
      'x-webhook-secret': webhookSecret,
      'x-webhook-signature': signature,
    });
    expect(response.status).toBe(200);
    const delivery = await t.run((ctx) =>
      ctx.db
        .query('billingWebhookDeliveries')
        .withIndex('by_delivery', (index) => index.eq('deliveryId', 'log_web8'))
        .unique(),
    );
    expect(delivery).toMatchObject({ outcome: 'unparsed', processedAt: expect.any(Number) });
    warn.mockRestore();
  });

  test('a signed non-subscription event with a null data is stored ignored', async () => {
    vi.stubEnv('ABACATE_PAY_WEBHOOK_SECRET', webhookSecret);
    const t = convexTest(schema, modules);
    const body = JSON.stringify({
      id: 'log_web9',
      event: 'payout.completed',
      devMode: true,
      data: null,
    });
    const signature = await sign(body);
    const response = await post(t, body, {
      'x-webhook-secret': webhookSecret,
      'x-webhook-signature': signature,
    });
    expect(response.status).toBe(200);
    const delivery = await t.run((ctx) =>
      ctx.db
        .query('billingWebhookDeliveries')
        .withIndex('by_delivery', (index) => index.eq('deliveryId', 'log_web9'))
        .unique(),
    );
    expect(delivery).toMatchObject({ outcome: 'ignored', processedAt: expect.any(Number) });
  });

  test('an applied plan_change through the webhook keeps the quantity, moves the amount', async () => {
    vi.stubEnv('ABACATE_PAY_WEBHOOK_SECRET', webhookSecret);
    const t = convexTest(schema, modules);
    const organizationId = await organizationIdOf(t);
    const id = await pendingSubscriptionOf(t, organizationId);
    await recordAndProcess(t); // goes active, 3 profiles, nothing pending
    // The docs' applied example: no data.quantity, no status/pendingUpdateId, and the
    // checkout still carries the original item — a `checkout.items` fallback reads 1.
    const body = JSON.stringify({
      id: 'log_web10',
      event: 'subscription.plan_changed',
      devMode: true,
      data: {
        subscription: { id: 'subs_sub1', amount: 20930, method: 'CARD', status: 'ACTIVE' },
        checkout: { id: 'bill_checkout1', items: [{ id: 'prod_panel', quantity: 1 }] },
      },
    });
    const signature = await sign(body);
    const response = await post(t, body, {
      'x-webhook-secret': webhookSecret,
      'x-webhook-signature': signature,
    });
    expect(response.status).toBe(200);
    await new Promise((resolve) => setTimeout(resolve, 20));
    await t.finishInProgressScheduledFunctions();
    expect(await subscriptionOf(t, id)).toMatchObject({
      managedProfiles: 3,
      amountInCents: 20930,
    });
    // A `checkout.items` quantity fallback would have recorded 1 here.
    const delivery = await t.run((ctx) =>
      ctx.db
        .query('billingWebhookDeliveries')
        .withIndex('by_delivery', (index) => index.eq('deliveryId', 'log_web10'))
        .unique(),
    );
    expect(delivery?.quantity).toBeNull();
  });
});
