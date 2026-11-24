import { z } from 'zod';
import {
  UserNotificationDraftSchema,
  UserNotificationSchema,
} from '@bratura/shared/entities/user-notification/entity';
import { CallNoticeAmendedNotificationSchema } from '@bratura/shared/entities/user-notification/kinds/call-notice-amended/variant';
import { DeadlineSoonNotificationSchema } from '@bratura/shared/entities/user-notification/kinds/deadline-soon/variant';
import { NewEligibleCallNotificationSchema } from '@bratura/shared/entities/user-notification/kinds/new-eligible-call/variant';
import { PlatformAnnouncementNotificationSchema } from '@bratura/shared/entities/user-notification/kinds/platform-announcement/variant';
import { documentId } from '@bratura/shared/primitives/code/id/fields';
import { requiredInstant } from '@bratura/shared/primitives/code/time/instant/fields';
import type { GenericId } from 'convex/values';
import type { MutationCtx, QueryCtx } from './_generated/server';
import { appError } from './lib/appError';
import { assertUserOwns } from './lib/auth';
import {
  internalZodMutation,
  internalZodQuery,
  userZodMutation,
  userZodQuery,
} from './lib/builders';
import { reserveDelivery } from './notificationDeliveries';

// The web inbox's only writer. A trigger (matching, the deadline cron, an amended call, an admin
// announcement) calls `notify`; the notification exists — and the inbox shows it — with or
// without a message channel. For every channel `userMessageChannels` says the user opted in to
// (and never opted out), the same call reserves a `notificationDeliveries` row — through the
// outbox's own `reserveDelivery`, its only insert; without it, nothing leaves the site
// (`docs/security.md` §2). Internal until login lands the auth builders
// (`docs/contracts.md` §3).

const userNotificationsOf = (ctx: QueryCtx, userId: GenericId<'users'>) =>
  ctx.db
    .query('userNotifications')
    .withIndex('by_user_and_dedupe_key', (index) => index.eq('userId', userId));

const NotifyMutationArgsSchema = z.object({
  notification: UserNotificationDraftSchema,
});
const NotifyMutationReturnsSchema = documentId('userNotifications');

/**
 * Creates the notification (natural-key upsert on user + `dedupeKey`) and reserves a delivery
 * per channel the user is opted in to. A repeat of the same key returns the existing row and
 * only fills in a missing delivery — an opt-in gained later still gets its send — unless the
 * user already read the notification: re-firing a read event sends nothing.
 */
export const notify = internalZodMutation({
  args: NotifyMutationArgsSchema,
  returns: NotifyMutationReturnsSchema,
  handler: async (ctx, { notification }) => {
    const known = await ctx.db
      .query('userNotifications')
      .withIndex('by_user_and_dedupe_key', (index) =>
        index.eq('userId', notification.userId).eq('dedupeKey', notification.dedupeKey),
      )
      .unique();
    const notificationId =
      known?._id ?? (await ctx.db.insert('userNotifications', { ...notification, readAt: null }));
    if (known !== null && known.readAt !== null) return notificationId;
    for (const channel of await optedInChannels(ctx, notification.userId))
      await reserveDelivery(ctx, notificationId, notification.userId, channel);
    return notificationId;
  },
});

/** The `userMessageChannels` rows for the user, opted in and never opted out. */
async function optedInChannels(ctx: MutationCtx, userId: GenericId<'users'>) {
  const channels = await ctx.db
    .query('userMessageChannels')
    .withIndex('by_user_and_channel', (index) => index.eq('userId', userId))
    .collect();
  return channels.filter((channel) => channel.optOutAt === null).map((channel) => channel.channel);
}

const GetUserNotificationQueryArgsSchema = z.object({
  notificationId: documentId('userNotifications'),
});
const GetUserNotificationQueryReturnsSchema = UserNotificationSchema;

/** A notification by id, for its delivery. */
export const getUserNotification = internalZodQuery({
  args: GetUserNotificationQueryArgsSchema,
  returns: GetUserNotificationQueryReturnsSchema,
  handler: async (ctx, { notificationId }) => {
    const notification = await ctx.db.get(notificationId);
    if (!notification) throw appError({ code: 'notFound' });
    return notification;
  },
});

const MarkReadMutationArgsSchema = z.object({ notificationId: documentId('userNotifications') });
const MarkReadMutationReturnsSchema = z.null();

/** Marks a notification read in the web inbox; reading it again keeps the first time. */
export const markRead = internalZodMutation({
  args: MarkReadMutationArgsSchema,
  returns: MarkReadMutationReturnsSchema,
  handler: async (ctx, { notificationId }): Promise<null> => {
    const notification = await ctx.db.get(notificationId);
    if (!notification) throw appError({ code: 'notFound' });
    if (notification.readAt === null) await ctx.db.patch(notificationId, { readAt: Date.now() });
    return null;
  },
});

const systemFields = {
  _id: documentId('userNotifications'),
  /** Convex's own timestamp: a `number`, not guaranteed to land on a whole millisecond. */
  _creationTime: z.number().nonnegative(),
};
const readState = { readAt: requiredInstant.nullable() };

const ListForUserQueryArgsSchema = z.object({ userId: documentId('users') });
const ListForUserQueryReturnsSchema = z.array(
  z.discriminatedUnion('kind', [
    NewEligibleCallNotificationSchema.extend({ ...readState, ...systemFields }),
    DeadlineSoonNotificationSchema.extend({ ...readState, ...systemFields }),
    CallNoticeAmendedNotificationSchema.extend({ ...readState, ...systemFields }),
    PlatformAnnouncementNotificationSchema.extend({ ...readState, ...systemFields }),
  ]),
);
type ListForUserResult = z.infer<typeof ListForUserQueryReturnsSchema>;

/** A user's notifications, newest first: the web inbox's read (internal until login exists). */
export const listForUser = internalZodQuery({
  args: ListForUserQueryArgsSchema,
  returns: ListForUserQueryReturnsSchema,
  handler: async (ctx, { userId }): Promise<ListForUserResult> =>
    (await userNotificationsOf(ctx, userId).collect()).sort(
      (a, b) => b._creationTime - a._creationTime,
    ),
});

const MyNotificationsQueryArgsSchema = z.object({});

/**
 * The caller's notifications, newest first — the inbox's public read. The owner comes from the
 * signed identity, never an arg, so it cannot return someone else's rows.
 */
export const myNotifications = userZodQuery({
  args: MyNotificationsQueryArgsSchema,
  returns: ListForUserQueryReturnsSchema,
  handler: async (ctx): Promise<ListForUserResult> =>
    (await userNotificationsOf(ctx, ctx.user._id).collect()).sort(
      (a, b) => b._creationTime - a._creationTime,
    ),
});

const MarkMyNotificationReadMutationArgsSchema = z.object({
  notificationId: documentId('userNotifications'),
});
const MarkMyNotificationReadMutationReturnsSchema = z.null();

/**
 * Marks the caller's notification read; `notFound` for a missing row, `forbidden` for someone
 * else's. Reading it again keeps the first time.
 */
export const markMyNotificationRead = userZodMutation({
  args: MarkMyNotificationReadMutationArgsSchema,
  returns: MarkMyNotificationReadMutationReturnsSchema,
  handler: async (ctx, { notificationId }): Promise<null> => {
    const notification = await ctx.db.get(notificationId);
    if (!notification) throw appError({ code: 'notFound' });
    assertUserOwns(notification, ctx.user);
    if (notification.readAt === null) await ctx.db.patch(notificationId, { readAt: Date.now() });
    return null;
  },
});
