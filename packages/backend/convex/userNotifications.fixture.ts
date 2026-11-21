import type { convexTest } from 'convex-test';
import type { ZonedInstant } from '@bratura/shared/primitives/code/time/zoned-instant/fields';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';

// Test setup the inbox and the outbox share: real `users` rows (WorkOS identity is out of scope),
// a `userMessageChannels` opt-in, a `callNotices` row and the delivery reserved for it.

type TestBackend = ReturnType<typeof convexTest>;

/** A real `users` row. */
export async function withUser(t: TestBackend): Promise<Id<'users'>> {
  return await t.mutation(internal.users.recordUser, {});
}

/** The user's Telegram row in `userMessageChannels`, opted in — how the demo creator is seeded. */
export async function withTelegramOptIn(
  t: TestBackend,
  userId: Id<'users'>,
  destination = '123456789',
) {
  await t.mutation(internal.userMessageChannels.setMessageChannel, {
    userId,
    channel: 'telegram',
    destination,
    optInAt: Date.now(),
    optOutAt: null,
  });
}

/** A stored call notice; `registrationCloses` overrides the default open window. */
export async function withCallNotice(
  t: TestBackend,
  overrides: { title?: string; registrationCloses?: ZonedInstant | null } = {},
): Promise<Id<'callNotices'>> {
  const known = await t.run(
    async (ctx) =>
      (await ctx.db.query('sources').collect()).find((s) => s.slug === 'mapas-federal') ?? null,
  );
  const sourceId =
    known?._id ?? (await t.mutation(internal.sources.registerSource, { slug: 'mapas-federal' }));
  const { callNoticeId } = await t.mutation(internal.callNotices.recordCallNotice, {
    sourceId,
    externalId: `opp-${Math.random().toString(36).slice(2, 10)}`,
    title: overrides.title ?? 'Edital das Artes',
    summary: null,
    officialUrl: 'https://mapacultural.secult.ce.gov.br/oportunidade/8498/',
    documentUrls: [],
    registrationOpens: null,
    registrationCloses: overrides.registrationCloses ?? null,
  });
  return callNoticeId;
}

/** The delivery row a notification reserved (the user has an opted-in channel). */
export async function deliveryOfNotification(
  t: TestBackend,
  notificationId: Id<'userNotifications'>,
) {
  return await t.run(async (ctx) =>
    (await ctx.db.query('notificationDeliveries').collect()).find(
      (row) => row.notificationId === notificationId,
    ),
  );
}
