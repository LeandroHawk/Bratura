import { convexTest } from 'convex-test';
import { describe, expect, test } from 'vitest';
import { internal } from './_generated/api';
import schema from './schema';
import { modules } from './test.setup';
import { withCallNotice, withTelegramOptIn, withUser } from './userNotifications.fixture';

const deliveriesOf = (t: ReturnType<typeof convexTest>) =>
  t.run((ctx) => ctx.db.query('notificationDeliveries').collect());

describe('notify', () => {
  test('the same dedupe key creates one notification, and it scopes to its user', async () => {
    const t = convexTest(schema, modules);
    const userId = await withUser(t);
    const otherUserId = await withUser(t);
    const callNoticeId = await withCallNotice(t);
    const notification = {
      kind: 'deadlineSoon' as const,
      userId,
      dedupeKey: 'deadlineSoon:d7',
      callNoticeId,
      occurrence: 'd7' as const,
    };
    const first = await t.mutation(internal.userNotifications.notify, { notification });
    expect(await t.mutation(internal.userNotifications.notify, { notification })).toBe(first);
    expect(await t.run((ctx) => ctx.db.query('userNotifications').collect())).toHaveLength(1);

    const other = await t.mutation(internal.userNotifications.notify, {
      notification: { ...notification, userId: otherUserId },
    });
    expect(other).not.toBe(first);
    expect(await t.run((ctx) => ctx.db.query('userNotifications').collect())).toHaveLength(2);
  });

  test('opt-in reserves one Telegram delivery, later opt-in fills a missing one', async () => {
    const t = convexTest(schema, modules);
    const userId = await withUser(t);
    const callNoticeId = await withCallNotice(t);
    const notification = {
      kind: 'callNoticeAmended' as const,
      userId,
      dedupeKey: 'amended:1',
      callNoticeId,
      amendedAt: Date.now(),
    };
    await t.mutation(internal.userNotifications.notify, { notification });
    expect(await deliveriesOf(t)).toHaveLength(0);

    await withTelegramOptIn(t, userId);
    const notificationId = await t.mutation(internal.userNotifications.notify, { notification });
    const [delivery] = await deliveriesOf(t);
    expect(delivery).toMatchObject({
      notificationId,
      userId,
      channel: 'telegram',
      status: 'sending',
      attempts: 0,
      sendingSince: null,
    });
    expect(delivery).not.toHaveProperty('destination');

    await t.mutation(internal.userNotifications.notify, { notification });
    expect(await deliveriesOf(t)).toHaveLength(1);
  });

  test('a notification already read reserves no delivery on a re-fire', async () => {
    const t = convexTest(schema, modules);
    const userId = await withUser(t);
    const callNoticeId = await withCallNotice(t);
    const notification = {
      kind: 'callNoticeAmended' as const,
      userId,
      dedupeKey: 'amended:read',
      callNoticeId,
      amendedAt: Date.now(),
    };
    const notificationId = await t.mutation(internal.userNotifications.notify, { notification });
    await t.mutation(internal.userNotifications.markRead, { notificationId });

    await withTelegramOptIn(t, userId);
    await t.mutation(internal.userNotifications.notify, { notification });
    expect(await deliveriesOf(t)).toHaveLength(0);
  });

  test('an opted-out channel reserves no delivery', async () => {
    const t = convexTest(schema, modules);
    const userId = await withUser(t);
    const callNoticeId = await withCallNotice(t);
    await t.mutation(internal.userMessageChannels.setMessageChannel, {
      userId,
      channel: 'telegram',
      destination: '123456789',
      optInAt: Date.now() - 10_000,
      optOutAt: Date.now(),
    });
    await t.mutation(internal.userNotifications.notify, {
      notification: {
        kind: 'callNoticeAmended' as const,
        userId,
        dedupeKey: 'amended:2',
        callNoticeId,
        amendedAt: Date.now(),
      },
    });
    expect(await deliveriesOf(t)).toHaveLength(0);
  });

  test('a platform announcement reaches the inbox with no delivery when the user has no opt-in', async () => {
    const t = convexTest(schema, modules);
    const userId = await withUser(t);
    await t.mutation(internal.userNotifications.notify, {
      notification: {
        kind: 'platformAnnouncement',
        userId,
        dedupeKey: 'announce:1',
        title: { ptBR: 'Bem-vinda ao Bratura', en: 'Welcome to Bratura' },
        body: { ptBR: 'Cadastre seu portfólio.', en: 'Register your portfolio.' },
      },
    });
    const [stored] = await t.query(internal.userNotifications.listForUser, { userId });
    expect(stored).toMatchObject({ kind: 'platformAnnouncement', readAt: null });
    expect(await deliveriesOf(t)).toHaveLength(0);
  });
});

describe('the inbox', () => {
  test("listForUser returns only the user's, newest first even when keys sort backwards", async () => {
    const t = convexTest(schema, modules);
    const userId = await withUser(t);
    const otherUserId = await withUser(t);
    for (const [owner, key] of [
      [userId, 'zzz'],
      [userId, 'aaa'],
      [otherUserId, 'mid'],
    ] as const) {
      await t.mutation(internal.userNotifications.notify, {
        notification: {
          kind: 'platformAnnouncement',
          userId: owner,
          dedupeKey: key,
          title: { ptBR: `Título ${key}`, en: `Title ${key}` },
          body: { ptBR: 'corpo', en: 'body' },
        },
      });
    }
    const list = await t.query(internal.userNotifications.listForUser, { userId });
    expect(list).toHaveLength(2);
    expect(list.map((n) => n.dedupeKey)).toEqual(['aaa', 'zzz']);
  });

  test('markRead keeps the first read time', async () => {
    const t = convexTest(schema, modules);
    const userId = await withUser(t);
    const notificationId = await t.mutation(internal.userNotifications.notify, {
      notification: {
        kind: 'platformAnnouncement',
        userId,
        dedupeKey: 'read:1',
        title: { ptBR: 'Olá', en: 'Hello' },
        body: { ptBR: 'corpo', en: 'body' },
      },
    });
    await t.mutation(internal.userNotifications.markRead, { notificationId });
    const first = await t.query(internal.userNotifications.getUserNotification, {
      notificationId,
    });
    expect(first.readAt).not.toBeNull();
    await t.mutation(internal.userNotifications.markRead, { notificationId });
    const second = await t.query(internal.userNotifications.getUserNotification, {
      notificationId,
    });
    expect(second.readAt).toBe(first.readAt);
  });
});
