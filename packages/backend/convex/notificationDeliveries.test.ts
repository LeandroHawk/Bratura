import { convexTest } from 'convex-test';
import type { GenericId } from 'convex/values';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { internal } from './_generated/api';
import { deliveryClaimLeaseMs, maxDeliveryAttempts } from './notificationDeliveries';
import schema from './schema';
import { modules } from './test.setup';

// The `users` table does not exist yet (Convex Auth lands it with login), so a test fabricates a
// document id for it: convex-test reads the table name off the id's non-digit suffix.
const testUserId = '0000000000000000000000001users' as GenericId<'users'>;
const chatId = '123456789';

async function withCallNotice(t: ReturnType<typeof convexTest>) {
  const known = await t.run(
    async (ctx) =>
      (await ctx.db.query('sources').collect()).find((s) => s.slug === 'mapas-federal') ?? null,
  );
  const sourceId =
    known?._id ?? (await t.mutation(internal.sources.registerSource, { slug: 'mapas-federal' }));
  const { callNoticeId } = await t.mutation(internal.callNotices.recordCallNotice, {
    sourceId,
    externalId: '8498',
    title: 'Edital das Artes',
    summary: null,
    officialUrl: 'https://mapacultural.secult.ce.gov.br/oportunidade/8498/',
    documentUrls: [],
    registrationOpens: null,
    registrationCloses: null,
  });
  return callNoticeId;
}

async function withTelegramOptIn(t: ReturnType<typeof convexTest>) {
  await t.mutation(internal.userMessageChannels.setMessageChannel, {
    userId: testUserId,
    channel: 'telegram',
    destination: chatId,
    optInAt: Date.now(),
    optOutAt: null,
  });
}

/** A notification plus its reserved delivery (the user has opt-in). */
async function withDelivery(t: ReturnType<typeof convexTest>, dedupeKey = 'd7:1') {
  await withTelegramOptIn(t);
  const callNoticeId = await withCallNotice(t);
  const notificationId = await t.mutation(internal.userNotifications.notify, {
    notification: {
      kind: 'deadlineSoon' as const,
      userId: testUserId,
      dedupeKey,
      callNoticeId,
      occurrence: 'd7' as const,
    },
  });
  const delivery = await t.run(async (ctx) =>
    (await ctx.db.query('notificationDeliveries').collect()).find(
      (row) => row.notificationId === notificationId,
    ),
  );
  return { notificationId, callNoticeId, deliveryId: delivery!._id };
}

const deliveryOf = (
  t: ReturnType<typeof convexTest>,
  deliveryId: GenericId<'notificationDeliveries'>,
) => t.run(async (ctx) => await ctx.db.get(deliveryId));

const channelOf = (t: ReturnType<typeof convexTest>) =>
  t.run(async (ctx) => (await ctx.db.query('userMessageChannels').collect()).at(0) ?? null);

const sendsOf = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls.filter(([url]) => String(url).includes('sendMessage'));

function telegramAnswers(sendStatus = 200) {
  const fetchMock = vi.fn<typeof fetch>(async (input) => {
    const url = String(input);
    if (url.includes('getMe'))
      return new Response(JSON.stringify({ ok: true, result: { id: 7, username: 'bratura_bot' } }));
    if (sendStatus === 200)
      return new Response(JSON.stringify({ ok: true, result: { message_id: 42 } }));
    return new Response(JSON.stringify({ ok: false, error_code: sendStatus }), {
      status: sendStatus,
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('sendPendingDeliveries', () => {
  beforeEach(() => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'bot-token');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  const sendArgs = (sendCeiling = 10) => ({ sendCeiling });

  test('sends a reserved delivery once, even when the run repeats', async () => {
    const t = convexTest(schema, modules);
    const { deliveryId } = await withDelivery(t);
    const fetchMock = telegramAnswers();

    const first = await t.action(internal.notificationDeliveries.sendPendingDeliveries, sendArgs());
    expect(first).toMatchObject({ sent: 1, failed: 0 });
    expect(await deliveryOf(t, deliveryId)).toMatchObject({
      status: 'sent',
      providerMessageId: '42',
    });

    const second = await t.action(
      internal.notificationDeliveries.sendPendingDeliveries,
      sendArgs(),
    );
    expect(second.sent).toBe(0);
    expect(sendsOf(fetchMock)).toHaveLength(1);
  });

  test('sends to the chat id stored on the user channel, never one passed in', async () => {
    const t = convexTest(schema, modules);
    await withDelivery(t);
    const fetchMock = telegramAnswers();
    await t.action(internal.notificationDeliveries.sendPendingDeliveries, sendArgs());
    const [send] = sendsOf(fetchMock);
    expect(String(send?.[1]?.body)).toContain(`"chat_id":"${chatId}"`);
  });

  test('checks the bot token once per run, not per message', async () => {
    const t = convexTest(schema, modules);
    await withDelivery(t, 'd7:a');
    await withDelivery(t, 'd7:b');
    const fetchMock = telegramAnswers();
    const result = await t.action(
      internal.notificationDeliveries.sendPendingDeliveries,
      sendArgs(),
    );
    expect(result.sent).toBe(2);
    const checks = fetchMock.mock.calls.filter(([url]) => String(url).includes('getMe'));
    expect(checks).toHaveLength(1);
  });

  test('a transient failure releases the claim and retries until the cap ends it', async () => {
    const t = convexTest(schema, modules);
    const { deliveryId } = await withDelivery(t);
    telegramAnswers(503);

    for (let run = 1; run <= maxDeliveryAttempts; run += 1) {
      await t.action(internal.notificationDeliveries.sendPendingDeliveries, sendArgs());
    }
    expect(await deliveryOf(t, deliveryId)).toMatchObject({
      status: 'failed',
      failure: 'sendAttemptsExhausted',
    });

    const again = await t.action(internal.notificationDeliveries.sendPendingDeliveries, sendArgs());
    expect(again).toMatchObject({ sent: 0, failed: 0, left: 0 });
  });

  test('a transient failure costs no quota: three later sends still fit the day', async () => {
    const t = convexTest(schema, modules);
    const { deliveryId: stuck } = await withDelivery(t, 'stuck');
    telegramAnswers(503);
    await t.action(internal.notificationDeliveries.sendPendingDeliveries, sendArgs());
    expect((await deliveryOf(t, stuck))?.attempts).toBe(1);

    for (const key of ['r1', 'r2', 'r3']) await withDelivery(t, key);
    telegramAnswers(200);
    const result = await t.action(
      internal.notificationDeliveries.sendPendingDeliveries,
      sendArgs(),
    );
    // The failed claim spent no quota, so all three of the day's sends are still there.
    expect(result.sent).toBe(3);
    expect(result.left).toBe(1);
  });

  test('a refusal is final: it never retries the same send', async () => {
    const t = convexTest(schema, modules);
    const { deliveryId } = await withDelivery(t);
    const fetchMock = telegramAnswers(400);

    await t.action(internal.notificationDeliveries.sendPendingDeliveries, sendArgs());
    expect(await deliveryOf(t, deliveryId)).toMatchObject({
      status: 'failed',
      failure: 'providerRejected',
    });
    expect(sendsOf(fetchMock)).toHaveLength(1);
  });

  test('a 401 stops the run without touching the rest', async () => {
    const t = convexTest(schema, modules);
    const { deliveryId: first } = await withDelivery(t, 'd7:a');
    const { deliveryId: second } = await withDelivery(t, 'd7:b');
    telegramAnswers(401);

    const result = await t.action(
      internal.notificationDeliveries.sendPendingDeliveries,
      sendArgs(),
    );
    expect(result.stoppedBy).toBe('providerUnreachable');
    const [gone, untouched] = [await deliveryOf(t, first), await deliveryOf(t, second)];
    // Whichever delivery the 401 hit was handed back; the other was never claimed.
    expect([gone, untouched].some((d) => d?.status === 'sending' && d.attempts === 1)).toBe(true);
    expect([gone, untouched].some((d) => d?.status === 'sending' && d.attempts === 0)).toBe(true);
  });

  test('a 403 records the opt-out, ends the delivery, and nothing claims that user again', async () => {
    const t = convexTest(schema, modules);
    const { deliveryId } = await withDelivery(t);
    telegramAnswers(403);

    const first = await t.action(internal.notificationDeliveries.sendPendingDeliveries, sendArgs());
    expect(first.failed).toBe(1);
    expect(await deliveryOf(t, deliveryId)).toMatchObject({
      status: 'failed',
      failure: 'providerRejected',
    });
    expect((await channelOf(t))?.optOutAt).not.toBeNull();

    // The block holds: a new notification reserves no delivery for an opted-out user.
    await t.mutation(internal.userNotifications.notify, {
      notification: {
        kind: 'callNoticeAmended' as const,
        userId: testUserId,
        dedupeKey: 'amended:after-block',
        callNoticeId: (await t.run((ctx) => ctx.db.query('callNotices').collect())).at(0)!._id,
        amendedAt: Date.now(),
      },
    });
    const second = await t.action(
      internal.notificationDeliveries.sendPendingDeliveries,
      sendArgs(),
    );
    expect(second).toMatchObject({ sent: 0, left: 0 });
  });

  test('a 2xx with an odd body is sent, never failed', async () => {
    const t = convexTest(schema, modules);
    const { deliveryId } = await withDelivery(t);
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input) =>
        String(input).includes('getMe')
          ? new Response(JSON.stringify({ ok: true, result: { id: 7 } }))
          : new Response('accepted', { status: 202 }),
      ),
    );
    const result = await t.action(
      internal.notificationDeliveries.sendPendingDeliveries,
      sendArgs(),
    );
    expect(result.sent).toBe(1);
    expect(await deliveryOf(t, deliveryId)).toMatchObject({
      status: 'sent',
      providerMessageId: null,
    });
  });

  test('the per-run cap stops the batch', async () => {
    const t = convexTest(schema, modules);
    await withDelivery(t, 'd7:a');
    await withDelivery(t, 'd7:b');
    telegramAnswers();
    const result = await t.action(
      internal.notificationDeliveries.sendPendingDeliveries,
      sendArgs(1),
    );
    expect(result).toMatchObject({ sent: 1, stoppedBy: 'sendCeiling', left: 1 });
  });

  test('the per-recipient cap waits: a fourth send of the day is not claimed', async () => {
    const t = convexTest(schema, modules);
    for (const key of ['r1', 'r2', 'r3', 'r4']) await withDelivery(t, key);
    const fetchMock = telegramAnswers();
    const result = await t.action(
      internal.notificationDeliveries.sendPendingDeliveries,
      sendArgs(),
    );
    expect(result.sent).toBe(3);
    expect(sendsOf(fetchMock)).toHaveLength(3);
    expect(result.left).toBe(1);
  });

  test('missing credentials stop the run before any claim', async () => {
    const t = convexTest(schema, modules);
    const { deliveryId } = await withDelivery(t);
    vi.unstubAllEnvs();
    const fetchMock = telegramAnswers();
    const result = await t.action(
      internal.notificationDeliveries.sendPendingDeliveries,
      sendArgs(),
    );
    expect(result).toMatchObject({ stoppedBy: 'notConfigured', sent: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await deliveryOf(t, deliveryId)).toMatchObject({
      status: 'sending',
      attempts: 0,
      sendingSince: null,
    });
  });

  test('no claim without a recipient: an opt-out user costs no attempt', async () => {
    const t = convexTest(schema, modules);
    const { deliveryId } = await withDelivery(t);
    await t.mutation(internal.userMessageChannels.markChannelOptOut, {
      userId: testUserId,
      channel: 'telegram',
      optOutAt: Date.now(),
    });
    const fetchMock = telegramAnswers();
    await t.action(internal.notificationDeliveries.sendPendingDeliveries, sendArgs());
    expect(sendsOf(fetchMock)).toHaveLength(0);
    expect(await deliveryOf(t, deliveryId)).toMatchObject({
      status: 'sending',
      attempts: 0,
    });
  });

  test('no claim without content: a deleted call notice costs no attempt', async () => {
    const t = convexTest(schema, modules);
    const { deliveryId, callNoticeId } = await withDelivery(t);
    await t.run(async (ctx) => {
      await ctx.db.delete(callNoticeId);
    });
    const fetchMock = telegramAnswers();
    await t.action(internal.notificationDeliveries.sendPendingDeliveries, sendArgs());
    expect(sendsOf(fetchMock)).toHaveLength(0);
    expect(await deliveryOf(t, deliveryId)).toMatchObject({
      status: 'sending',
      attempts: 0,
    });
  });
});

describe('claimDelivery', () => {
  test('two claims of one delivery claim once', async () => {
    const t = convexTest(schema, modules);
    const { deliveryId } = await withDelivery(t);
    expect(await t.mutation(internal.notificationDeliveries.claimDelivery, { deliveryId })).toBe(
      'claimed',
    );
    expect(await t.mutation(internal.notificationDeliveries.claimDelivery, { deliveryId })).toBe(
      'waiting',
    );
  });

  test('a live lease is waiting, never exhausted, even on the last attempt', async () => {
    const t = convexTest(schema, modules);
    const { deliveryId } = await withDelivery(t);
    // Simulate a delivery on its final attempt whose claim is in flight right now.
    await t.run(async (ctx) => {
      await ctx.db.patch(deliveryId, {
        attempts: maxDeliveryAttempts,
        sendingSince: Date.now(),
      });
    });
    expect(await t.mutation(internal.notificationDeliveries.claimDelivery, { deliveryId })).toBe(
      'waiting',
    );
    expect((await deliveryOf(t, deliveryId))?.status).toBe('sending');
  });

  test('a dead claim can be taken over only after its lease', async () => {
    const t = convexTest(schema, modules);
    vi.useFakeTimers();
    const { deliveryId } = await withDelivery(t);
    expect(await t.mutation(internal.notificationDeliveries.claimDelivery, { deliveryId })).toBe(
      'claimed',
    );
    vi.setSystemTime(Date.now() + deliveryClaimLeaseMs - 1_000);
    expect(await t.mutation(internal.notificationDeliveries.claimDelivery, { deliveryId })).toBe(
      'waiting',
    );
    vi.setSystemTime(Date.now() + 2_000);
    expect(await t.mutation(internal.notificationDeliveries.claimDelivery, { deliveryId })).toBe(
      'claimed',
    );
    expect(await deliveryOf(t, deliveryId)).toMatchObject({ attempts: 2 });
  });
});
