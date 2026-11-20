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
import type { Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';
import { appError } from './lib/appError';
import { internalZodMutation, internalZodQuery } from './lib/builders';

// The web inbox's only writer. A trigger (matching, the deadline cron, an amended call, an admin
// announcement) calls `notify`; the notification exists — and the inbox shows it — with or
// without a message channel. When `userMessageChannels` says the user opted in to a channel
// (and never opted out), the same call reserves a `notificationDeliveries` row; without it,
// nothing leaves the site (`docs/security.md` §2). Internal until login lands the `users` table
// and the auth builders (`docs/contracts.md` §3).

const userNotificationsOf = (ctx: QueryCtx, userId: GenericId<'users'>) =>
  ctx.db
    .query('userNotifications')
    .withIndex('by_user_and_dedupe_key', (index) => index.eq('userId', userId));

const NotifyMutationArgsSchema = z.object({
  notification: UserNotificationDraftSchema,
});
const NotifyMutationReturnsSchema = documentId('userNotifications');

/**
 * Creates the notification (natural-key upsert on user + `dedupeKey`) and, when the user has an
 * opted-in message channel, reserves its delivery. A repeat of the same key returns the existing
 * row and only fills in a missing delivery — an opt-in gained later still gets its send.
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
    if (await hasOptedInChannel(ctx, notification.userId))
      await reserveDelivery(ctx, notificationId, notification.userId);
    return notificationId;
  },
});

/** A `userMessageChannels` row for the channel, opted in and never opted out. */
async function hasOptedInChannel(ctx: MutationCtx, userId: GenericId<'users'>) {
  const channel = await ctx.db
    .query('userMessageChannels')
    .withIndex('by_user_and_channel', (index) =>
      index.eq('userId', userId).eq('channel', 'telegram'),
    )
    .unique();
  return channel !== null && channel.optOutAt === null;
}

/** Reserves the Telegram delivery once (outbox pattern); a second call finds it and stops. */
async function reserveDelivery(
  ctx: MutationCtx,
  notificationId: Id<'userNotifications'>,
  userId: GenericId<'users'>,
) {
  const known = await ctx.db
    .query('notificationDeliveries')
    .withIndex('by_notification_and_channel', (index) =>
      index.eq('notificationId', notificationId).eq('channel', 'telegram'),
    )
    .unique();
  if (known) return;
  await ctx.db.insert('notificationDeliveries', {
    notificationId,
    userId,
    channel: 'telegram',
    status: 'sending',
    attempts: 0,
    sendingSince: null,
  });
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
  _creationTime: requiredInstant,
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
