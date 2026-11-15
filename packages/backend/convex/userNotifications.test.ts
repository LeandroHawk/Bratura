import { convexTest } from 'convex-test';
import type { GenericId } from 'convex/values';
import { describe, expect, test } from 'vitest';
import { internal } from './_generated/api';
import schema from './schema';
import { modules } from './test.setup';

// The `users` table does not exist yet (Convex Auth lands it with login), so a test fabricates a
// document id for it: convex-test reads the table name off the id's non-digit suffix.
const testUserId = '0000000000000000000000001users' as GenericId<'users'>;
const otherUserId = '0000000000000000000000002users' as GenericId<'users'>;

async function withCallNotice(t: ReturnType<typeof convexTest>) {
  const sourceId = await t.mutation(internal.sources.registerSource, { slug: 'mapas-federal' });
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

const deliveriesOf = (t: ReturnType<typeof convexTest>) =>
  t.run((ctx) => ctx.db.query('notificationDeliveries').collect());

describe('notify', () => {
  test('the same dedupe key creates one notification', async () => {
    const t = convexTest(schema, modules);
    const callNoticeId = await withCallNotice(t);
    const notification = {
      kind: 'deadlineSoon' as const,
      userId: testUserId,
      dedupeKey: 'deadlineSoon:d7',
      callNoticeId,
      occurrence: 'd7' as const,
    };
    const args = { notification, telegramOptInAt: null };
    const first = await t.mutation(internal.userNotifications.notify, args);
    expect(await t.mutation(internal.userNotifications.notify, args)).toBe(first);
    expect(await t.run((ctx) => ctx.db.query('userNotifications').collect())).toHaveLength(1);
  });

  test('opt-in reserves one Telegram delivery, later opt-in fills a missing one', async () => {
    const t = convexTest(schema, modules);
    const callNoticeId = await withCallNotice(t);
    const notification = {
      kind: 'callNoticeAmended' as const,
      userId: testUserId,
      dedupeKey: 'amended:1',
      callNoticeId,
      amendedAt: Date.now(),
    };
    await t.mutation(internal.userNotifications.notify, {
      notification,
      telegramOptInAt: null,
    });
    expect(await deliveriesOf(t)).toHaveLength(0);

    const notificationId = await t.mutation(internal.userNotifications.notify, {
      notification,
      telegramOptInAt: Date.now(),
    });
    const [delivery] = await deliveriesOf(t);
    expect(delivery).toMatchObject({
      notificationId,
      userId: testUserId,
      channel: 'telegram',
      status: 'sending',
      attempts: 0,
      sendingSince: null,
    });
    expect(delivery).not.toHaveProperty('destination');

    await t.mutation(internal.userNotifications.notify, {
      notification,
      telegramOptInAt: Date.now(),
    });
    expect(await deliveriesOf(t)).toHaveLength(1);
  });

  test('a platform announcement reaches the inbox with no delivery when the user has no opt-in', async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.userNotifications.notify, {
      notification: {
        kind: 'platformAnnouncement',
        userId: testUserId,
        dedupeKey: 'announce:1',
        title: { ptBR: 'Bem-vinda ao Bratura', en: 'Welcome to Bratura' },
        body: { ptBR: 'Cadastre seu portfólio.', en: 'Register your portfolio.' },
      },
      telegramOptInAt: null,
    });
    const [stored] = await t.query(internal.userNotifications.listForUser, {
      userId: testUserId,
    });
    expect(stored).toMatchObject({ kind: 'platformAnnouncement', readAt: null });
    expect(await deliveriesOf(t)).toHaveLength(0);
  });
});

describe('the inbox', () => {
  test("listForUser returns only the user's, newest first", async () => {
    const t = convexTest(schema, modules);
    for (const [userId, key] of [
      [testUserId, 'a1'],
      [testUserId, 'a2'],
      [otherUserId, 'b1'],
    ] as const) {
      await t.mutation(internal.userNotifications.notify, {
        notification: {
          kind: 'platformAnnouncement',
          userId,
          dedupeKey: key,
          title: { ptBR: `Título ${key}`, en: `Title ${key}` },
          body: { ptBR: 'corpo', en: 'body' },
        },
        telegramOptInAt: null,
      });
    }
    const list = await t.query(internal.userNotifications.listForUser, {
      userId: testUserId,
    });
    expect(list).toHaveLength(2);
    expect(list[0]?.dedupeKey).toBe('a2');
    expect(list.every((n) => n.userId === testUserId)).toBe(true);
  });

  test('markRead keeps the first read time', async () => {
    const t = convexTest(schema, modules);
    const notificationId = await t.mutation(internal.userNotifications.notify, {
      notification: {
        kind: 'platformAnnouncement',
        userId: testUserId,
        dedupeKey: 'read:1',
        title: { ptBR: 'Olá', en: 'Hello' },
        body: { ptBR: 'corpo', en: 'body' },
      },
      telegramOptInAt: null,
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
