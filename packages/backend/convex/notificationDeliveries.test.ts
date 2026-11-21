import { convexTest } from 'convex-test';
import type { ZonedInstant } from '@bratura/shared/primitives/code/time/zoned-instant/fields';
import type { Id } from './_generated/dataModel';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { internal } from './_generated/api';
import { deliveryClaimLeaseMs, maxDeliveryAttempts } from './notificationDeliveries';
import schema from './schema';
import { modules } from './test.setup';
import {
  deliveryOfNotification,
  withCallNotice,
  withTelegramOptIn,
  withUser,
} from './userNotifications.fixture';

const chatId = '123456789';
const dayMs = 24 * 60 * 60 * 1000;
const saoPaulo = 'America/Sao_Paulo' as ZonedInstant['timeZone'];
const inDays = (days: number): ZonedInstant => ({
  at: Date.now() + days * dayMs,
  timeZone: saoPaulo,
  precision: 'minute',
});

type TestBackend = ReturnType<typeof convexTest>;

/** A `newEligibleCall` notification plus its reserved delivery (the user has opt-in). */
async function withDelivery(
  t: TestBackend,
  dedupeKey = 'new:1',
  options: { closes?: ZonedInstant | null; title?: string; userId?: Id<'users'> } = {},
) {
  const userId = options.userId ?? (await withUser(t));
  await withTelegramOptIn(t, userId, chatId);
  const callNoticeId = await withCallNotice(t, {
    registrationCloses: options.closes ?? null,
    title: options.title,
  });
  const notificationId = await t.mutation(internal.userNotifications.notify, {
    notification: {
      kind: 'newEligibleCall' as const,
      userId,
      dedupeKey,
      callNoticeId,
      matchStatus: 'eligible' as const,
    },
  });
  const delivery = await deliveryOfNotification(t, notificationId);
  return { notificationId, callNoticeId, deliveryId: delivery!._id, userId };
}

/** A `deadlineSoon` notification plus its reserved delivery. */
async function withDeadlineDelivery(
  t: TestBackend,
  options: {
    occurrence: 'd7' | 'd1';
    closes: ZonedInstant;
    userId: Id<'users'>;
    callNoticeId?: Id<'callNotices'>;
    dedupeKey?: string;
  },
) {
  await withTelegramOptIn(t, options.userId, chatId);
  const callNoticeId =
    options.callNoticeId ?? (await withCallNotice(t, { registrationCloses: options.closes }));
  const notificationId = await t.mutation(internal.userNotifications.notify, {
    notification: {
      kind: 'deadlineSoon' as const,
      userId: options.userId,
      dedupeKey: options.dedupeKey ?? `deadline:${options.occurrence}`,
      callNoticeId,
      occurrence: options.occurrence,
    },
  });
  const delivery = await deliveryOfNotification(t, notificationId);
  return { notificationId, callNoticeId, deliveryId: delivery!._id };
}

const deliveryOf = (t: TestBackend, deliveryId: Id<'notificationDeliveries'>) =>
  t.run(async (ctx) => await ctx.db.get(deliveryId));

const channelOf = (t: TestBackend) =>
  t.run(async (ctx) => (await ctx.db.query('userMessageChannels').collect()).at(0) ?? null);

const sendsOf = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls.filter(([url]) => String(url).includes('sendMessage'));

const okGetMe = () =>
  new Response(JSON.stringify({ ok: true, result: { id: 7, username: 'bratura_bot' } }));
const okSend = () => new Response(JSON.stringify({ ok: true, result: { message_id: 42 } }));

function telegramAnswers(sendStatus = 200) {
  const fetchMock = vi.fn<typeof fetch>(async (input) => {
    const url = String(input);
    if (url.includes('getMe')) return okGetMe();
    if (sendStatus === 200) return okSend();
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
    await withDelivery(t, 'a');
    await withDelivery(t, 'b');
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

  test('a timed-out send is transient: the claim is released and a retry sends', async () => {
    const t = convexTest(schema, modules);
    const { deliveryId } = await withDelivery(t);
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input) => {
        if (String(input).includes('getMe')) return okGetMe();
        throw new DOMException('The operation timed out', 'TimeoutError');
      }),
    );
    await t.action(internal.notificationDeliveries.sendPendingDeliveries, sendArgs());
    expect(await deliveryOf(t, deliveryId)).toMatchObject({
      status: 'sending',
      attempts: 1,
      sendingSince: null,
    });

    telegramAnswers();
    const retry = await t.action(internal.notificationDeliveries.sendPendingDeliveries, sendArgs());
    expect(retry.sent).toBe(1);
    expect((await deliveryOf(t, deliveryId))?.status).toBe('sent');
  });

  test('a transient failure costs no quota: three later sends still fit the day', async () => {
    const t = convexTest(schema, modules);
    const userId = await withUser(t);
    const { deliveryId: stuck } = await withDelivery(t, 'stuck', { userId });
    telegramAnswers(503);
    await t.action(internal.notificationDeliveries.sendPendingDeliveries, sendArgs());
    expect((await deliveryOf(t, stuck))?.attempts).toBe(1);

    for (const key of ['r1', 'r2', 'r3']) await withDelivery(t, key, { userId });
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

  test('a 401 on getMe means a bad token: notConfigured, nothing claimed', async () => {
    const t = convexTest(schema, modules);
    const { deliveryId } = await withDelivery(t);
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => new Response('unauthorized', { status: 401 })),
    );
    const result = await t.action(
      internal.notificationDeliveries.sendPendingDeliveries,
      sendArgs(),
    );
    expect(result.stoppedBy).toBe('notConfigured');
    expect(await deliveryOf(t, deliveryId)).toMatchObject({
      status: 'sending',
      attempts: 0,
      sendingSince: null,
    });
  });

  test('a 401 mid-run stops as notConfigured and gives the attempt back', async () => {
    const t = convexTest(schema, modules);
    const { deliveryId: first } = await withDelivery(t, 'a');
    const { deliveryId: second } = await withDelivery(t, 'b');
    telegramAnswers(401);

    const result = await t.action(
      internal.notificationDeliveries.sendPendingDeliveries,
      sendArgs(),
    );
    expect(result.stoppedBy).toBe('notConfigured');
    for (const deliveryId of [first, second]) {
      // The claim the 401 hit was refunded; the other delivery was never claimed.
      expect(await deliveryOf(t, deliveryId)).toMatchObject({
        status: 'sending',
        attempts: 0,
        sendingSince: null,
      });
    }
  });

  test('a 429 throttles the bot: the run stops and the claim is refunded', async () => {
    const t = convexTest(schema, modules);
    const { deliveryId: first } = await withDelivery(t, 'a');
    const { deliveryId: second } = await withDelivery(t, 'b');
    telegramAnswers(429);

    const result = await t.action(
      internal.notificationDeliveries.sendPendingDeliveries,
      sendArgs(),
    );
    expect(result.stoppedBy).toBe('providerThrottled');
    for (const deliveryId of [first, second]) {
      expect(await deliveryOf(t, deliveryId)).toMatchObject({
        status: 'sending',
        attempts: 0,
        sendingSince: null,
      });
    }
  });

  test('a 403 records the opt-out, ends the delivery, and nothing claims that user again', async () => {
    const t = convexTest(schema, modules);
    const { deliveryId, userId } = await withDelivery(t);
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
        userId,
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
    const userId = await withUser(t);
    await withDelivery(t, 'a', { userId });
    await withDelivery(t, 'b', { userId });
    telegramAnswers();
    const result = await t.action(
      internal.notificationDeliveries.sendPendingDeliveries,
      sendArgs(1),
    );
    expect(result).toMatchObject({ sent: 1, stoppedBy: 'sendCeiling', left: 1 });
  });

  test('the per-recipient cap waits: a fourth send of the day is not claimed', async () => {
    const t = convexTest(schema, modules);
    const userId = await withUser(t);
    for (const key of ['r1', 'r2', 'r3', 'r4']) await withDelivery(t, key, { userId });
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

  test('a delivery with no recipient ends optedOut and never comes back', async () => {
    const t = convexTest(schema, modules);
    const { deliveryId, userId } = await withDelivery(t);
    await t.mutation(internal.userMessageChannels.markChannelOptOut, {
      userId,
      channel: 'telegram',
      optOutAt: Date.now(),
    });
    const fetchMock = telegramAnswers();
    await t.action(internal.notificationDeliveries.sendPendingDeliveries, sendArgs());
    expect(sendsOf(fetchMock)).toHaveLength(0);
    expect(await deliveryOf(t, deliveryId)).toMatchObject({
      status: 'failed',
      failure: 'optedOut',
    });
    const again = await t.action(internal.notificationDeliveries.sendPendingDeliveries, sendArgs());
    expect(again.left).toBe(0);
  });

  test('a deleted call notice ends its delivery subjectGone', async () => {
    const t = convexTest(schema, modules);
    const { deliveryId, callNoticeId } = await withDelivery(t);
    await t.run(async (ctx) => {
      await ctx.db.delete(callNoticeId);
    });
    const fetchMock = telegramAnswers();
    await t.action(internal.notificationDeliveries.sendPendingDeliveries, sendArgs());
    expect(sendsOf(fetchMock)).toHaveLength(0);
    expect(await deliveryOf(t, deliveryId)).toMatchObject({
      status: 'failed',
      failure: 'subjectGone',
    });
  });

  test('a call whose window already closed ends its delivery subjectGone', async () => {
    const t = convexTest(schema, modules);
    const { deliveryId } = await withDelivery(t, 'closed', { closes: inDays(-1) });
    const fetchMock = telegramAnswers();
    await t.action(internal.notificationDeliveries.sendPendingDeliveries, sendArgs());
    expect(sendsOf(fetchMock)).toHaveLength(0);
    expect(await deliveryOf(t, deliveryId)).toMatchObject({
      status: 'failed',
      failure: 'subjectGone',
    });
  });

  test('a row that errors in the middle fails alone; the batch continues', async () => {
    const t = convexTest(schema, modules);
    const userId = await withUser(t);
    await withDelivery(t, 'a', { userId });
    const { deliveryId: second } = await withDelivery(t, 'b', { userId });
    await withDelivery(t, 'c', { userId });
    // The second delivery (by creation order) is deleted once the first send went out.
    let deleted = false;
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input) => {
        if (String(input).includes('getMe')) return okGetMe();
        if (!deleted) {
          deleted = true;
          await t.run(async (ctx) => {
            await ctx.db.delete(second);
          });
        }
        return okSend();
      }),
    );
    const result = await t.action(
      internal.notificationDeliveries.sendPendingDeliveries,
      sendArgs(),
    );
    expect(result).toMatchObject({ sent: 2, failed: 1, stoppedBy: 'nothingLeft' });
  });

  test('urgency first inside the cap: a d1 and a call closing in 3 days lead the queue', async () => {
    const t = convexTest(schema, modules);
    const userId = await withUser(t);
    // Two new calls far from closing, then a d1, then a new call closing in 3 days.
    await withDelivery(t, 'long-a', { userId, closes: inDays(30), title: 'Edital Longe A' });
    await withDelivery(t, 'long-b', { userId, closes: inDays(30), title: 'Edital Longe B' });
    const { callNoticeId: d1Call } = await withDeadlineDelivery(t, {
      occurrence: 'd1',
      closes: inDays(0.5),
      userId,
    });
    await t.run(async (ctx) => {
      await ctx.db.patch(d1Call, { title: 'Edital D1' });
    });
    await withDelivery(t, 'soon', { userId, closes: inDays(3), title: 'Edital Perto' });
    const fetchMock = telegramAnswers();

    const result = await t.action(
      internal.notificationDeliveries.sendPendingDeliveries,
      sendArgs(),
    );
    expect(result.sent).toBe(3);
    const texts = sendsOf(fetchMock).map((call) => String(call[1]?.body));
    expect(texts[0]).toContain('Edital D1');
    expect(texts[1]).toContain('Edital Perto');
    expect(texts[2]).toContain('Edital Longe A');
  });
});

describe('deadline checks at send', () => {
  beforeEach(() => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'bot-token');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const sendArgs = () => ({ sendCeiling: 10 });

  test('a d1 whose call was extended ends superseded, not sent', async () => {
    const t = convexTest(schema, modules);
    const userId = await withUser(t);
    const { deliveryId, callNoticeId } = await withDeadlineDelivery(t, {
      occurrence: 'd1',
      closes: inDays(0.5),
      userId,
    });
    // The call was extended by 10 days after the reminder was created.
    await t.run(async (ctx) => {
      await ctx.db.patch(callNoticeId, { registrationCloses: inDays(10) });
    });
    const fetchMock = telegramAnswers();
    const result = await t.action(
      internal.notificationDeliveries.sendPendingDeliveries,
      sendArgs(),
    );
    expect(sendsOf(fetchMock)).toHaveLength(0);
    expect(await deliveryOf(t, deliveryId)).toMatchObject({
      status: 'failed',
      failure: 'superseded',
    });
    expect(result.left).toBe(0);
  });

  test('a d7 over a new-call notice for the same closing call ends superseded', async () => {
    const t = convexTest(schema, modules);
    const userId = await withUser(t);
    await withTelegramOptIn(t, userId, chatId);
    const callNoticeId = await withCallNotice(t, { registrationCloses: inDays(5) });
    await t.mutation(internal.userNotifications.notify, {
      notification: {
        kind: 'newEligibleCall' as const,
        userId,
        dedupeKey: 'new:same-call',
        callNoticeId,
        matchStatus: 'eligible' as const,
      },
    });
    const { deliveryId: d7Delivery } = await withDeadlineDelivery(t, {
      occurrence: 'd7',
      closes: inDays(5),
      userId,
      callNoticeId,
      dedupeKey: 'deadline:d7:same-call',
    });
    const fetchMock = telegramAnswers();

    const result = await t.action(
      internal.notificationDeliveries.sendPendingDeliveries,
      sendArgs(),
    );
    expect(result.sent).toBe(1);
    expect(sendsOf(fetchMock)).toHaveLength(1);
    expect(await deliveryOf(t, d7Delivery)).toMatchObject({
      status: 'failed',
      failure: 'superseded',
    });
  });
});

describe('claimDelivery', () => {
  test('two claims of one delivery claim once', async () => {
    const t = convexTest(schema, modules);
    const { deliveryId } = await withDelivery(t);
    expect(
      await t.mutation(internal.notificationDeliveries.claimDelivery, { deliveryId }),
    ).toMatchObject({ outcome: 'claimed', sendingSince: expect.any(Number) });
    expect(
      await t.mutation(internal.notificationDeliveries.claimDelivery, { deliveryId }),
    ).toMatchObject({ outcome: 'waiting' });
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
    expect(
      await t.mutation(internal.notificationDeliveries.claimDelivery, { deliveryId }),
    ).toMatchObject({ outcome: 'waiting' });
    expect((await deliveryOf(t, deliveryId))?.status).toBe('sending');
  });

  test('a dead claim can be taken over only after its lease', async () => {
    const t = convexTest(schema, modules);
    vi.useFakeTimers();
    const { deliveryId } = await withDelivery(t);
    expect(
      await t.mutation(internal.notificationDeliveries.claimDelivery, { deliveryId }),
    ).toMatchObject({ outcome: 'claimed' });
    vi.setSystemTime(Date.now() + deliveryClaimLeaseMs - 1_000);
    expect(
      await t.mutation(internal.notificationDeliveries.claimDelivery, { deliveryId }),
    ).toMatchObject({ outcome: 'waiting' });
    vi.setSystemTime(Date.now() + 2_000);
    expect(
      await t.mutation(internal.notificationDeliveries.claimDelivery, { deliveryId }),
    ).toMatchObject({ outcome: 'claimed' });
    expect(await deliveryOf(t, deliveryId)).toMatchObject({ attempts: 2 });
  });

  test('a confirm with a moved lease is already resolved, never an error', async () => {
    const t = convexTest(schema, modules);
    const { deliveryId } = await withDelivery(t);
    const claim = await t.mutation(internal.notificationDeliveries.claimDelivery, {
      deliveryId,
    });
    if (claim.outcome !== 'claimed') throw new Error('expected a claim');
    // Another run took the lease over while this one was sending.
    await t.run(async (ctx) => {
      await ctx.db.patch(deliveryId, { sendingSince: claim.sendingSince + 1 });
    });
    await t.mutation(internal.notificationDeliveries.confirmDeliverySent, {
      deliveryId,
      sendingSince: claim.sendingSince,
      providerMessageId: '42',
    });
    expect((await deliveryOf(t, deliveryId))?.status).toBe('sending');
    await t.mutation(internal.notificationDeliveries.confirmDeliveryFailed, {
      deliveryId,
      sendingSince: claim.sendingSince,
      failure: 'providerRejected',
    });
    expect((await deliveryOf(t, deliveryId))?.status).toBe('sending');
  });
});
