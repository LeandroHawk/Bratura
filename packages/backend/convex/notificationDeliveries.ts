import { z } from 'zod';
import {
  NotificationDeliveryFailureEnum,
  NotificationDeliverySchema,
} from '@bratura/shared/entities/notification-delivery/entity';
import { documentId } from '@bratura/shared/primitives/code/id/fields';
import { nullableString } from '@bratura/shared/primitives/code/string/fields';
import { requiredInstant } from '@bratura/shared/primitives/code/time/instant/fields';
import { callNoticeDeadline } from '@bratura/shared/entities/call-notice/fragments/registration-window/fields';
import type { DeliveryChannel } from '@bratura/shared/primitives/domain/delivery-channel/enum';
import { defineRateLimits } from 'convex-helpers/server/rateLimit';
import { ConvexError, type GenericId } from 'convex/values';
import { internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';
import { appError } from './lib/appError';
import { internalZodAction, internalZodMutation, internalZodQuery } from './lib/builders';
import { optionalEnv } from './lib/env';
import { sendTelegramNotification } from './model/telegram/sendMessage';
import { fetchTelegramBot, TelegramAnswerError } from './model/telegram/client';

// The `notificationDeliveries` outbox: `userNotifications.notify` reserves a row through
// `reserveDelivery` (below — the only insert), a send run claims it with a lease
// (`claimDelivery`), calls the provider through `model/telegram/`, and confirms `sent` or
// `failed`. A transient failure releases the claim to retry; a refusal, an opt-out, a gone
// subject or a superseded fact ends it. `sendCeiling` and `telegramDeliverySend` (per recipient,
// fixed window) brake the volume: Telegram's own limits are per bot and per chat.
// Return types are written out: this module calls its own functions through `internal`.

/** A claim lives this long; a run that dies holding one can be taken over after it. */
export const deliveryClaimLeaseMs = 2 * 60 * 1000;
/** Claims a delivery gets before it ends `failed`: keeps retries bounded and cheap. */
export const maxDeliveryAttempts = 3;
/** Sends per run still under the action's 10 min at the worst case (a timeout per send). */
const sendLoopBudgetMs = 5 * 60 * 1000;
const dayMs = 24 * 60 * 60 * 1000;

// Per-recipient send cap (fixed window; keyed by userId so no chat id lands in the table). The
// claim only peeks (`checkRateLimit`); `confirmDeliverySent` spends — a transient failure costs
// an attempt, never a quota.
const { rateLimit, checkRateLimit } = defineRateLimits({
  telegramDeliverySend: { kind: 'fixed window', rate: 3, period: dayMs },
});

const identityFieldsOf = (delivery: Doc<'notificationDeliveries'>) => ({
  notificationId: delivery.notificationId,
  userId: delivery.userId,
  channel: delivery.channel,
});

const getDeliveryRow = async (ctx: QueryCtx, deliveryId: Id<'notificationDeliveries'>) => {
  const delivery = await ctx.db.get(deliveryId);
  if (!delivery) throw appError({ code: 'notFound' });
  return delivery;
};

/**
 * Reserves the delivery once per notification and channel (outbox pattern): the only insert into
 * `notificationDeliveries` lives here, called by `userNotifications.notify` — a second call
 * finds the row and stops.
 */
export async function reserveDelivery(
  ctx: MutationCtx,
  notificationId: Id<'userNotifications'>,
  userId: GenericId<'users'>,
  channel: DeliveryChannel,
) {
  const known = await ctx.db
    .query('notificationDeliveries')
    .withIndex('by_notification_and_channel', (index) =>
      index.eq('notificationId', notificationId).eq('channel', channel),
    )
    .unique();
  if (known) return;
  await ctx.db.insert('notificationDeliveries', {
    notificationId,
    userId,
    channel,
    status: 'sending',
    attempts: 0,
    sendingSince: null,
  });
}

// What is left to send ---------------------------------------------------------------------------

const ListDeliveriesToSendQueryArgsSchema = z.object({});
const ListDeliveriesToSendQueryReturnsSchema = z.array(documentId('notificationDeliveries'));
type ListDeliveriesToSendResult = z.infer<typeof ListDeliveriesToSendQueryReturnsSchema>;

/**
 * Claimable deliveries, most urgent first: a `d1` and a new call closing within 7 days lead, by
 * close date, then the rest by creation — the analysis of the year's calls found half the closes
 * within 10 days of discovery, so creation order alone would let a `d1` die waiting. The status
 * index bounds the scan to `sending` rows.
 */
export const listDeliveriesToSend = internalZodQuery({
  args: ListDeliveriesToSendQueryArgsSchema,
  returns: ListDeliveriesToSendQueryReturnsSchema,
  handler: async (ctx): Promise<ListDeliveriesToSendResult> => {
    const now = Date.now();
    const sending = await ctx.db
      .query('notificationDeliveries')
      .withIndex('by_status', (index) => index.eq('status', 'sending'))
      .collect();
    const claimable = sending.filter(
      (delivery) =>
        delivery.status === 'sending' &&
        (delivery.sendingSince === null || now - delivery.sendingSince >= deliveryClaimLeaseMs),
    );
    const urgencyOf = async (delivery: Doc<'notificationDeliveries'>) => {
      const notification = await ctx.db.get(delivery.notificationId);
      const closes =
        notification && 'callNoticeId' in notification
          ? ((await ctx.db.get(notification.callNoticeId))?.registrationCloses?.at ?? null)
          : null;
      const urgent =
        (notification?.kind === 'deadlineSoon' && notification.occurrence === 'd1') ||
        (notification?.kind === 'newEligibleCall' && closes !== null && closes - now <= 7 * dayMs);
      return {
        urgent,
        closes: closes ?? Number.MAX_SAFE_INTEGER,
        createdAt: delivery._creationTime,
      };
    };
    const ranked = await Promise.all(
      claimable.map(async (d) => ({ id: d._id, ...(await urgencyOf(d)) })),
    );
    return ranked
      .sort(
        (a, b) =>
          Number(b.urgent) - Number(a.urgent) || a.closes - b.closes || a.createdAt - b.createdAt,
      )
      .map((entry) => entry.id);
  },
});

const GetDeliveryQueryArgsSchema = z.object({ deliveryId: documentId('notificationDeliveries') });
const GetDeliveryQueryReturnsSchema = NotificationDeliverySchema;

/** A delivery by id, for its send. */
export const getDelivery = internalZodQuery({
  args: GetDeliveryQueryArgsSchema,
  returns: GetDeliveryQueryReturnsSchema,
  handler: async (ctx, { deliveryId }) => await getDeliveryRow(ctx, deliveryId),
});

const NewCallDeliveryForUserQueryArgsSchema = z.object({
  userId: documentId('users'),
  callNoticeId: documentId('callNotices'),
});
const NewCallDeliveryForUserQueryReturnsSchema = z.enum(['sending', 'sent']).nullable();

/**
 * The status of the `newEligibleCall` delivery for the same user and call, when there is one: a
 * `d7` over a new-call notice the person got (or will get) repeats the same edital within the
 * 3-a-day cap, so it ends `superseded` instead.
 */
export const newCallDeliveryForUser = internalZodQuery({
  args: NewCallDeliveryForUserQueryArgsSchema,
  returns: NewCallDeliveryForUserQueryReturnsSchema,
  handler: async (ctx, { userId, callNoticeId }) => {
    const notifications = await ctx.db
      .query('userNotifications')
      .withIndex('by_user_and_dedupe_key', (index) => index.eq('userId', userId))
      .collect();
    const newCall = notifications.find(
      (n) => n.kind === 'newEligibleCall' && n.callNoticeId === callNoticeId,
    );
    if (!newCall) return null;
    const delivery = await ctx.db
      .query('notificationDeliveries')
      .withIndex('by_notification_and_channel', (index) => index.eq('notificationId', newCall._id))
      .first();
    if (delivery?.status === 'sent') return 'sent';
    if (delivery?.status === 'sending') return 'sending';
    return null;
  },
});

// Claim and confirm ------------------------------------------------------------------------------

const ClaimDeliveryMutationArgsSchema = z.object({
  deliveryId: documentId('notificationDeliveries'),
});
const ClaimDeliveryMutationReturnsSchema = z.union([
  z.object({ outcome: z.literal('claimed'), sendingSince: requiredInstant }),
  z.object({ outcome: z.enum(['waiting', 'exhausted']) }),
]);
type ClaimDeliveryResult = z.infer<typeof ClaimDeliveryMutationReturnsSchema>;

/**
 * Claims a delivery right before its provider call: `claimed` grants the lease (one attempt
 * consumed) and hands back its start, `waiting` means a live claim or the per-recipient cap
 * holds it, `exhausted` ends a delivery that ran out of attempts. The lease check comes first: a
 * concurrent run must see an in-flight send as `waiting`, never fail it from under the sender.
 */
export const claimDelivery = internalZodMutation({
  args: ClaimDeliveryMutationArgsSchema,
  returns: ClaimDeliveryMutationReturnsSchema,
  handler: async (ctx, { deliveryId }): Promise<ClaimDeliveryResult> => {
    const delivery = await ctx.db.get(deliveryId);
    if (!delivery || delivery.status !== 'sending') return { outcome: 'waiting' };
    const now = Date.now();
    if (delivery.sendingSince !== null && now - delivery.sendingSince < deliveryClaimLeaseMs)
      return { outcome: 'waiting' };
    if (delivery.attempts >= maxDeliveryAttempts) {
      await ctx.db.replace(deliveryId, {
        ...identityFieldsOf(delivery),
        status: 'failed',
        failedAt: now,
        failure: 'sendAttemptsExhausted',
      });
      return { outcome: 'exhausted' };
    }
    const { ok } = await checkRateLimit(ctx, {
      name: 'telegramDeliverySend',
      key: delivery.userId,
    });
    if (!ok) return { outcome: 'waiting' };
    await ctx.db.patch(deliveryId, {
      attempts: delivery.attempts + 1,
      sendingSince: now,
    });
    return { outcome: 'claimed', sendingSince: now };
  },
});

const ReleaseDeliveryClaimMutationArgsSchema = z.object({
  deliveryId: documentId('notificationDeliveries'),
  /** The lease the caller holds: if it moved, another run owns the row and nothing is touched. */
  sendingSince: requiredInstant,
  /** Give the attempt back: a stopped run (401, 429) never spent it. */
  refundAttempt: z.boolean().optional(),
});
const ReleaseDeliveryClaimMutationReturnsSchema = z.null();

/** Hands a claimed delivery back to the queue (a transient failure, nothing worth sending). */
export const releaseDeliveryClaim = internalZodMutation({
  args: ReleaseDeliveryClaimMutationArgsSchema,
  returns: ReleaseDeliveryClaimMutationReturnsSchema,
  handler: async (ctx, { deliveryId, sendingSince, refundAttempt }): Promise<null> => {
    const delivery = await ctx.db.get(deliveryId);
    if (delivery?.status !== 'sending' || delivery.sendingSince !== sendingSince) return null;
    await ctx.db.patch(deliveryId, {
      sendingSince: null,
      ...(refundAttempt ? { attempts: Math.max(0, delivery.attempts - 1) } : {}),
    });
    return null;
  },
});

/** The lease check every confirm shares: ours to resolve, or already someone else's. */
const claimStillOurs = (delivery: Doc<'notificationDeliveries'>, sendingSince: number | null) =>
  delivery.status === 'sending' && delivery.sendingSince === sendingSince;

const ConfirmDeliverySentMutationArgsSchema = z.object({
  deliveryId: documentId('notificationDeliveries'),
  sendingSince: requiredInstant,
  providerMessageId: nullableString('medium'),
});
const ConfirmDeliverySentMutationReturnsSchema = z.null();

/**
 * Confirms a claimed delivery as sent (a `replace`, so the claim fields leave with the status)
 * and spends the recipient's quota: only a confirmed send costs one. A lease that moved is
 * already resolved by whoever took it — skipped, never an error.
 */
export const confirmDeliverySent = internalZodMutation({
  args: ConfirmDeliverySentMutationArgsSchema,
  returns: ConfirmDeliverySentMutationReturnsSchema,
  handler: async (ctx, { deliveryId, sendingSince, providerMessageId }): Promise<null> => {
    const delivery = await getDeliveryRow(ctx, deliveryId);
    if (!claimStillOurs(delivery, sendingSince)) return null;
    await rateLimit(ctx, { name: 'telegramDeliverySend', key: delivery.userId });
    await ctx.db.replace(deliveryId, {
      ...identityFieldsOf(delivery),
      status: 'sent',
      sentAt: Date.now(),
      providerMessageId,
    });
    return null;
  },
});

const ConfirmDeliveryFailedMutationArgsSchema = z.object({
  deliveryId: documentId('notificationDeliveries'),
  /** The lease held (`null` when ending an unclaimed delivery): a moved one is skipped. */
  sendingSince: requiredInstant.nullable(),
  failure: NotificationDeliveryFailureEnum,
});
const ConfirmDeliveryFailedMutationReturnsSchema = z.null();

/** Ends a delivery with why, as a code: a refusal the same send would repeat, attempts out,
 * no opted-in recipient left, a gone subject, or a newer fact that makes it pointless. */
export const confirmDeliveryFailed = internalZodMutation({
  args: ConfirmDeliveryFailedMutationArgsSchema,
  returns: ConfirmDeliveryFailedMutationReturnsSchema,
  handler: async (ctx, { deliveryId, sendingSince, failure }): Promise<null> => {
    const delivery = await getDeliveryRow(ctx, deliveryId);
    if (!claimStillOurs(delivery, sendingSince)) return null;
    await ctx.db.replace(deliveryId, {
      ...identityFieldsOf(delivery),
      status: 'failed',
      failedAt: Date.now(),
      failure,
    });
    return null;
  },
});

// The send loop, by hand -------------------------------------------------------------------------

const SendPendingDeliveriesActionArgsSchema = z.object({
  /** At most this many sends per run: the brake on volume and on provider-side abuse. */
  sendCeiling: z.int().positive().max(200),
});
const SendPendingDeliveriesActionReturnsSchema = z.object({
  sent: z.int().nonnegative(),
  failed: z.int().nonnegative(),
  left: z.int().nonnegative(),
  stoppedBy: z.enum([
    'nothingLeft',
    'sendCeiling',
    'notConfigured',
    'providerUnreachable',
    'providerThrottled',
    'timeBudget',
  ]),
});
type SendPendingDeliveriesResult = z.infer<typeof SendPendingDeliveriesActionReturnsSchema>;

/** `true` when the provider refused the send outright: retrying the same request repeats it. */
const isFinalRefusal = (error: unknown) =>
  error instanceof TelegramAnswerError &&
  error.status >= 400 &&
  error.status < 500 &&
  error.status !== 401 &&
  error.status !== 429 &&
  error.status !== 403;

/**
 * Sends what `listDeliveriesToSend` lists, up to `sendCeiling` or the time budget. Destination
 * and content are resolved before the claim, and a delivery that can never send ends there
 * (`optedOut`, `subjectGone`, `superseded`) rather than burning attempts. Each iteration is
 * isolated: a row that errors fails alone and the batch continues. A 401 or a failed `getMe`
 * means the token itself is wrong — `notConfigured`; a 429 means Telegram is throttling the
 * whole bot — `providerThrottled`; both hand the attempt back and stop the run. A 403 records
 * the block as an opt-out. By hand:
 * `pnpm exec convex run notificationDeliveries:sendPendingDeliveries '{"sendCeiling":20}'`.
 */
export const sendPendingDeliveries = internalZodAction({
  args: SendPendingDeliveriesActionArgsSchema,
  returns: SendPendingDeliveriesActionReturnsSchema,
  handler: async (ctx, { sendCeiling }): Promise<SendPendingDeliveriesResult> => {
    const result: SendPendingDeliveriesResult = {
      sent: 0,
      failed: 0,
      left: 0,
      stoppedBy: 'nothingLeft',
    };
    const token = optionalEnv('TELEGRAM_BOT_TOKEN');
    if (!token) return { ...result, stoppedBy: 'notConfigured' };
    try {
      await fetchTelegramBot({ token });
    } catch (error) {
      console.warn('Telegram getMe failed');
      return {
        ...result,
        stoppedBy:
          error instanceof TelegramAnswerError && error.status === 401
            ? 'notConfigured'
            : 'providerUnreachable',
      };
    }
    const pending = await ctx.runQuery(internal.notificationDeliveries.listDeliveriesToSend, {});
    result.left = pending.length;
    const startedAt = Date.now();

    const endDelivery = async (
      deliveryId: Id<'notificationDeliveries'>,
      failure: z.infer<typeof NotificationDeliveryFailureEnum>,
    ) => {
      await ctx.runMutation(internal.notificationDeliveries.confirmDeliveryFailed, {
        deliveryId,
        sendingSince: null,
        failure,
      });
      result.failed += 1;
      result.left -= 1;
    };

    for (const deliveryId of pending) {
      if (result.sent + result.failed >= sendCeiling)
        return { ...result, stoppedBy: 'sendCeiling' };
      if (Date.now() - startedAt > sendLoopBudgetMs) return { ...result, stoppedBy: 'timeBudget' };
      /** The lease this iteration holds, so the catch can hand it back. */
      let heldClaimSince: number | null = null;
      try {
        const delivery = await ctx.runQuery(internal.notificationDeliveries.getDelivery, {
          deliveryId,
        });
        if (delivery.status !== 'sending') {
          result.left -= 1;
          continue;
        }
        const destination = await ctx.runQuery(internal.userMessageChannels.destinationForUser, {
          userId: delivery.userId,
          channel: delivery.channel,
        });
        if (destination === null) {
          await endDelivery(deliveryId, 'optedOut');
          continue;
        }
        const notification = await ctx
          .runQuery(internal.userNotifications.getUserNotification, {
            notificationId: delivery.notificationId,
          })
          .catch(() => null);
        if (notification === null) {
          await endDelivery(deliveryId, 'subjectGone');
          continue;
        }
        const callNotice =
          'callNoticeId' in notification
            ? await ctx
                .runQuery(internal.callNotices.getCallNotice, {
                  callNoticeId: notification.callNoticeId,
                })
                .catch(() => null)
            : null;
        if ('callNoticeId' in notification && callNotice === null) {
          await endDelivery(deliveryId, 'subjectGone');
          continue;
        }
        const now = Date.now();
        if (
          callNotice !== null &&
          callNoticeDeadline({ registrationCloses: callNotice.registrationCloses }, now) ===
            'closed'
        ) {
          await endDelivery(deliveryId, 'subjectGone');
          continue;
        }
        if (notification.kind === 'deadlineSoon' && callNotice !== null) {
          const closesAt = callNotice.registrationCloses?.at ?? null;
          const daysLeft = closesAt === null ? null : (closesAt - now) / dayMs;
          const stillDue =
            daysLeft !== null &&
            (notification.occurrence === 'd1' ? daysLeft <= 1 : daysLeft > 1 && daysLeft <= 7);
          if (!stillDue) {
            await endDelivery(deliveryId, 'superseded');
            continue;
          }
          if (
            notification.occurrence === 'd7' &&
            daysLeft <= 7 &&
            (await ctx.runQuery(internal.notificationDeliveries.newCallDeliveryForUser, {
              userId: delivery.userId,
              callNoticeId: notification.callNoticeId,
            })) !== null
          ) {
            await endDelivery(deliveryId, 'superseded');
            continue;
          }
        }

        const claim = await ctx.runMutation(internal.notificationDeliveries.claimDelivery, {
          deliveryId,
        });
        if (claim.outcome === 'exhausted') {
          result.failed += 1;
          result.left -= 1;
          continue;
        }
        if (claim.outcome !== 'claimed') continue;
        heldClaimSince = claim.sendingSince;

        let outcome: Awaited<ReturnType<typeof sendTelegramNotification>> | null = null;
        let sendError: unknown = null;
        try {
          outcome = await sendTelegramNotification({
            token,
            notification,
            callNotice,
            destination,
            now,
          });
        } catch (error) {
          sendError = error;
        }
        if (outcome?.outcome === 'sent') {
          await ctx.runMutation(internal.notificationDeliveries.confirmDeliverySent, {
            deliveryId,
            sendingSince: claim.sendingSince,
            providerMessageId: outcome.providerMessageId,
          });
          result.sent += 1;
          result.left -= 1;
        } else if (outcome?.outcome === 'noContent') {
          await ctx.runMutation(internal.notificationDeliveries.releaseDeliveryClaim, {
            deliveryId,
            sendingSince: claim.sendingSince,
          });
        } else if (sendError instanceof TelegramAnswerError && sendError.status === 401) {
          await ctx.runMutation(internal.notificationDeliveries.releaseDeliveryClaim, {
            deliveryId,
            sendingSince: claim.sendingSince,
            refundAttempt: true,
          });
          console.warn('Telegram token refused mid-run');
          return { ...result, stoppedBy: 'notConfigured' };
        } else if (sendError instanceof TelegramAnswerError && sendError.status === 429) {
          await ctx.runMutation(internal.notificationDeliveries.releaseDeliveryClaim, {
            deliveryId,
            sendingSince: claim.sendingSince,
            refundAttempt: true,
          });
          console.warn('Telegram throttled the bot mid-run');
          return { ...result, stoppedBy: 'providerThrottled' };
        } else if (sendError instanceof TelegramAnswerError && sendError.status === 403) {
          await ctx.runMutation(internal.userMessageChannels.markChannelOptOut, {
            userId: delivery.userId,
            channel: delivery.channel,
            optOutAt: Date.now(),
          });
          await ctx.runMutation(internal.notificationDeliveries.confirmDeliveryFailed, {
            deliveryId,
            sendingSince: claim.sendingSince,
            failure: 'providerRejected',
          });
          result.failed += 1;
          result.left -= 1;
        } else if (isFinalRefusal(sendError) || delivery.attempts + 1 >= maxDeliveryAttempts) {
          const failure = isFinalRefusal(sendError) ? 'providerRejected' : 'sendAttemptsExhausted';
          console.warn('Delivery send failed', deliveryId, failure);
          await ctx.runMutation(internal.notificationDeliveries.confirmDeliveryFailed, {
            deliveryId,
            sendingSince: claim.sendingSince,
            failure,
          });
          result.failed += 1;
          result.left -= 1;
        } else {
          console.warn('Delivery send failed', deliveryId, 'transient');
          await ctx.runMutation(internal.notificationDeliveries.releaseDeliveryClaim, {
            deliveryId,
            sendingSince: claim.sendingSince,
          });
        }
      } catch (error) {
        console.warn('Delivery failed', deliveryId, error instanceof Error ? error.name : 'error');
        result.failed += 1;
        if (error instanceof ConvexError && (error.data as { code?: string }).code === 'notFound') {
          // The row (or its subject) is gone: resolved, no longer claimable.
          result.left -= 1;
        } else if (heldClaimSince !== null) {
          // Anything else leaves the row claimable: release the lease this iteration held.
          await ctx
            .runMutation(internal.notificationDeliveries.releaseDeliveryClaim, {
              deliveryId,
              sendingSince: heldClaimSince,
            })
            .catch(() => null);
        }
      }
    }
    return result;
  },
});
