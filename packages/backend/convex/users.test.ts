import { convexTest } from 'convex-test';
import { describe, expect, test } from 'vitest';
import { api, internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import schema from './schema';
import { modules } from './test.setup';

const asUser = (t: ReturnType<typeof convexTest>, token = 'workos|user-a', name = 'Ana') =>
  t.withIdentity({ tokenIdentifier: token, name });

const notify = (t: ReturnType<typeof convexTest>, userId: Id<'users'>, dedupeKey: string) =>
  t.mutation(internal.userNotifications.notify, {
    notification: {
      kind: 'platformAnnouncement' as const,
      userId,
      dedupeKey,
      title: { ptBR: 'Olá', en: 'Hello' },
      body: { ptBR: 'Corpo', en: 'Body' },
    },
  });

describe('store', () => {
  test('first sign-in creates the row from the JWT; a repeat returns it', async () => {
    const t = convexTest(schema, modules);
    const signedIn = asUser(t);
    const id = await signedIn.mutation(api.users.store, {});
    expect(await signedIn.mutation(api.users.store, {})).toBe(id);
    expect(await t.run((ctx) => ctx.db.query('users').collect())).toHaveLength(1);
    expect(await t.run((ctx) => ctx.db.get(id))).toMatchObject({
      tokenIdentifier: 'workos|user-a',
      name: 'Ana',
    });
  });

  test('a different token gets a different row', async () => {
    const t = convexTest(schema, modules);
    const a = await asUser(t).mutation(api.users.store, {});
    const b = await asUser(t, 'workos|user-b').mutation(api.users.store, {});
    expect(b).not.toBe(a);
  });

  test('a signed-out caller is unauthenticated, and nothing is stored', async () => {
    const t = convexTest(schema, modules);
    await expect(t.mutation(api.users.store, {})).rejects.toMatchObject({
      data: { code: 'unauthenticated' },
    });
    expect(await t.run((ctx) => ctx.db.query('users').collect())).toHaveLength(0);
  });
});

describe('owned reads and writes', () => {
  test('myNotifications returns only the caller’s rows; signed-out is unauthenticated', async () => {
    const t = convexTest(schema, modules);
    const ana = asUser(t);
    const bia = asUser(t, 'workos|user-b', 'Bia');
    const anaId = await ana.mutation(api.users.store, {});
    const biaId = await bia.mutation(api.users.store, {});
    await notify(t, anaId, 'n1');
    await notify(t, biaId, 'n2');
    const mine = await ana.query(api.userNotifications.myNotifications, {});
    expect(mine).toHaveLength(1);
    expect(mine[0]?.userId).toBe(anaId);
    await expect(t.query(api.userNotifications.myNotifications, {})).rejects.toMatchObject({
      data: { code: 'unauthenticated' },
    });
  });

  test('markMyNotificationRead marks the caller’s row, never someone else’s', async () => {
    const t = convexTest(schema, modules);
    const ana = asUser(t);
    const bia = asUser(t, 'workos|user-b', 'Bia');
    const anaId = await ana.mutation(api.users.store, {});
    const biaId = await bia.mutation(api.users.store, {});
    const notificationId = await notify(t, anaId, 'n1');
    // A valid id for a row that is gone: notFound, not forbidden.
    const goneId = await t.run(async (ctx) => {
      const id = await ctx.db.insert('userNotifications', {
        kind: 'platformAnnouncement',
        userId: biaId,
        dedupeKey: 'gone',
        title: { ptBR: 'x', en: 'x' },
        body: { ptBR: 'x', en: 'x' },
        readAt: null,
      });
      await ctx.db.delete(id);
      return id;
    });

    // Someone else's row: forbidden. Signed out: unauthenticated. Unknown id: notFound.
    await expect(
      bia.mutation(api.userNotifications.markMyNotificationRead, { notificationId }),
    ).rejects.toMatchObject({ data: { code: 'forbidden' } });
    await expect(
      t.mutation(api.userNotifications.markMyNotificationRead, { notificationId }),
    ).rejects.toMatchObject({ data: { code: 'unauthenticated' } });
    await expect(
      ana.mutation(api.userNotifications.markMyNotificationRead, { notificationId: goneId }),
    ).rejects.toMatchObject({ data: { code: 'notFound' } });

    await ana.mutation(api.userNotifications.markMyNotificationRead, { notificationId });
    const row = await t.run((ctx) => ctx.db.get(notificationId));
    expect(row?.readAt).toEqual(expect.any(Number));
  });
});
