import { z } from 'zod';
import {
  NotificationDeliveryFailureEnum,
  NotificationDeliverySchema,
} from '@bratura/shared/entities/notification-delivery/entity';
import { documentId } from '@bratura/shared/primitives/code/id/fields';
import { nullableString } from '@bratura/shared/primitives/code/string/fields';
import { defineRateLimits } from 'convex-helpers/server/rateLimit';
import { internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import type { QueryCtx } from './_generated/server';
import { appError } from './lib/appError';
import { internalZodAction, internalZodMutation, internalZodQuery } from './lib/builders';
import { optionalEnv } from './lib/env';
import { sendTelegramNotification } from './model/telegram/sendMessage';
import { fetchTelegramBot, TelegramAnswerError } from './model/telegram/client';

// The `notificationDeliveries` outbox: `userNotifications.notify` reserves a row, a send run
// claims it with a lease (`claimDelivery`), calls the provider through `model/telegram/`, and
// confirms `sent` or `failed`. A transient failure releases the claim to retry; a refusal (4xx)
// or the attempts cap ends it. `sendCeiling` and `telegramDeliverySend` (per recipient, fixed
// window) brake the volume: Telegram's own limits are per bot and per chat.
// Return types are written out: this module calls its own functions through `internal`.

/** A claim lives this long; a run that dies holding one can be taken over after it. */
export const deliveryClaimLeaseMs = 2 * 60 * 1000;
/** Claims a delivery gets before it ends `failed`: keeps retries bounded and cheap. */
export const maxDeliveryAttempts = 3;
/** Sends per run still under the action's 10 min at the worst case (a timeout per send). */
const sendLoopBudgetMs = 5 * 60 * 1000;

// Per-recipient send cap (fixed window; keyed by userId so no chat id lands in the table). The
// claim only peeks (`checkRateLimit`); `confirmDeliverySent` spends — a transient failure costs
// an attempt, never a quota.
const { rateLimit, checkRateLimit } = defineRateLimits({
  telegramDeliverySend: { kind: 'fixed window', rate: 3, period: 24 * 60 * 60 * 1000 },
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

// What is left to send ---------------------------------------------------------------------------

const ListDeliveriesToSendQueryArgsSchema = z.object({});
const ListDeliveriesToSendQueryReturnsSchema = z.array(documentId('notificationDeliveries'));
type ListDeliveriesToSendResult = z.infer<typeof ListDeliveriesToSendQueryReturnsSchema>;

/** Claimable deliveries: waiting, or held by a claim whose lease died. */
export const listDeliveriesToSend = internalZodQuery({
  args: ListDeliveriesToSendQueryArgsSchema,
  returns: ListDeliveriesToSendQueryReturnsSchema,
  handler: async (ctx): Promise<ListDeliveriesToSendResult> => {
    const now = Date.now();
    const sending = await ctx.db
      .query('notificationDeliveries')
      .withIndex('by_status', (index) => index.eq('status', 'sending'))
      .collect();
    return sending
      .filter(
        (delivery) =>
          delivery.status === 'sending' &&
          (delivery.sendingSince === null || now - delivery.sendingSince >= deliveryClaimLeaseMs),
      )
      .map((delivery) => delivery._id);
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

// Claim and confirm ------------------------------------------------------------------------------

const ClaimDeliveryMutationArgsSchema = z.object({
  deliveryId: documentId('notificationDeliveries'),
});
const ClaimDeliveryMutationReturnsSchema = z.enum(['claimed', 'waiting', 'exhausted']);
type ClaimDeliveryResult = z.infer<typeof ClaimDeliveryMutationReturnsSchema>;

/**
 * Claims a delivery right before its provider call: `claimed` grants the lease (one attempt
 * consumed), `waiting` means a live claim or the per-recipient cap holds it, `exhausted` ends a
 * delivery that ran out of attempts. The lease check comes first: a concurrent run must see an
 * in-flight send as `waiting`, never fail it from under the sender.
 */
export const claimDelivery = internalZodMutation({
  args: ClaimDeliveryMutationArgsSchema,
  returns: ClaimDeliveryMutationReturnsSchema,
  handler: async (ctx, { deliveryId }): Promise<ClaimDeliveryResult> => {
    const delivery = await ctx.db.get(deliveryId);
    if (!delivery || delivery.status !== 'sending') return 'waiting';
    const now = Date.now();
    if (delivery.sendingSince !== null && now - delivery.sendingSince < deliveryClaimLeaseMs)
      return 'waiting';
    if (delivery.attempts >= maxDeliveryAttempts) {
      await ctx.db.replace(deliveryId, {
        ...identityFieldsOf(delivery),
        status: 'failed',
        failedAt: now,
        failure: 'sendAttemptsExhausted',
      });
      return 'exhausted';
    }
    const { ok } = await checkRateLimit(ctx, {
      name: 'telegramDeliverySend',
      key: delivery.userId,
    });
    if (!ok) return 'waiting';
    await ctx.db.patch(deliveryId, {
      attempts: delivery.attempts + 1,
      sendingSince: now,
    });
    return 'claimed';
  },
});

const ReleaseDeliveryClaimMutationArgsSchema = ClaimDeliveryMutationArgsSchema;
const ReleaseDeliveryClaimMutationReturnsSchema = z.null();

/** Hands a claimed delivery back to the queue (a transient failure, nothing worth sending). */
export const releaseDeliveryClaim = internalZodMutation({
  args: ReleaseDeliveryClaimMutationArgsSchema,
  returns: ReleaseDeliveryClaimMutationReturnsSchema,
  handler: async (ctx, { deliveryId }): Promise<null> => {
    const delivery = await ctx.db.get(deliveryId);
    if (delivery?.status === 'sending') await ctx.db.patch(deliveryId, { sendingSince: null });
    return null;
  },
});

const ConfirmDeliverySentMutationArgsSchema = z.object({
  deliveryId: documentId('notificationDeliveries'),
  providerMessageId: nullableString('medium'),
});
const ConfirmDeliverySentMutationReturnsSchema = z.null();

/**
 * Confirms a claimed delivery as sent (a `replace`, so the claim fields leave with the status)
 * and spends the recipient's quota: only a confirmed send costs one.
 */
export const confirmDeliverySent = internalZodMutation({
  args: ConfirmDeliverySentMutationArgsSchema,
  returns: ConfirmDeliverySentMutationReturnsSchema,
  handler: async (ctx, { deliveryId, providerMessageId }): Promise<null> => {
    const delivery = await getDeliveryRow(ctx, deliveryId);
    if (delivery.status !== 'sending') throw appError({ code: 'conflict' });
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
  failure: NotificationDeliveryFailureEnum,
});
const ConfirmDeliveryFailedMutationReturnsSchema = z.null();

/** Ends a delivery with why, as a code: a refusal the same send would repeat, or attempts out. */
export const confirmDeliveryFailed = internalZodMutation({
  args: ConfirmDeliveryFailedMutationArgsSchema,
  returns: ConfirmDeliveryFailedMutationReturnsSchema,
  handler: async (ctx, { deliveryId, failure }): Promise<null> => {
    const delivery = await getDeliveryRow(ctx, deliveryId);
    if (delivery.status !== 'sending') throw appError({ code: 'conflict' });
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
    'timeBudget',
  ]),
});
type SendPendingDeliveriesResult = z.infer<typeof SendPendingDeliveriesActionReturnsSchema>;

/** `true` when the provider refused the send outright: retrying the same request repeats it. */
const isFinalRefusal = (error: unknown) =>
  error instanceof TelegramAnswerError &&
  error.status >= 400 &&
  error.status < 500 &&
  error.status !== 429 &&
  error.status !== 403;

/**
 * Sends what `listDeliveriesToSend` lists, up to `sendCeiling` or the time budget. Destination
 * and content are resolved before the claim, so a delivery without a recipient or with nothing
 * to say never burns an attempt. A claim then grants the lease, the provider call sits in the
 * only `try`, and the confirm lands outside it. Missing env or a failed `getMe` — or a 401
 * mid-run, the token revoked under us — stops the run without touching the rest; a 403 records
 * the block as an opt-out so nothing claims that user again. By hand:
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
    } catch {
      console.warn('Telegram getMe failed');
      return { ...result, stoppedBy: 'providerUnreachable' };
    }
    const pending = await ctx.runQuery(internal.notificationDeliveries.listDeliveriesToSend, {});
    result.left = pending.length;
    const startedAt = Date.now();
    for (const deliveryId of pending) {
      if (result.sent + result.failed >= sendCeiling)
        return { ...result, stoppedBy: 'sendCeiling' };
      if (Date.now() - startedAt > sendLoopBudgetMs) return { ...result, stoppedBy: 'timeBudget' };
      const delivery = await ctx.runQuery(internal.notificationDeliveries.getDelivery, {
        deliveryId,
      });
      if (delivery.status !== 'sending') continue;
      const destination = await ctx.runQuery(internal.userMessageChannels.destinationForUser, {
        userId: delivery.userId,
        channel: delivery.channel,
      });
      const notification =
        destination === null
          ? null
          : await ctx.runQuery(internal.userNotifications.getUserNotification, {
              notificationId: delivery.notificationId,
            });
      let callNoticeTitle: string | null = null;
      if (notification !== null && 'callNoticeId' in notification) {
        try {
          callNoticeTitle = (
            await ctx.runQuery(internal.callNotices.getCallNotice, {
              callNoticeId: notification.callNoticeId,
            })
          ).title;
        } catch {
          callNoticeTitle = null;
        }
      }

      // No recipient or nothing to say: skip without a claim, so no attempt or quota is spent
      // and the delivery stays claimable for when the gap closes (a later opt-in, a restored
      // call notice).
      const hasContent =
        notification !== null && !('callNoticeId' in notification && callNoticeTitle === null);
      if (destination === null || !hasContent) continue;

      const claim = await ctx.runMutation(internal.notificationDeliveries.claimDelivery, {
        deliveryId,
      });
      if (claim === 'exhausted') {
        result.failed += 1;
        result.left -= 1;
        continue;
      }
      if (claim !== 'claimed') continue;

      let outcome: Awaited<ReturnType<typeof sendTelegramNotification>> | null = null;
      let sendError: unknown = null;
      try {
        outcome = await sendTelegramNotification({
          token,
          notification,
          callNoticeTitle,
          destination,
        });
      } catch (error) {
        sendError = error;
      }
      result.left -= 1;

      if (outcome?.outcome === 'sent') {
        await ctx.runMutation(internal.notificationDeliveries.confirmDeliverySent, {
          deliveryId,
          providerMessageId: outcome.providerMessageId,
        });
        result.sent += 1;
      } else if (outcome?.outcome === 'noContent') {
        await ctx.runMutation(internal.notificationDeliveries.releaseDeliveryClaim, {
          deliveryId,
        });
      } else if (sendError instanceof TelegramAnswerError && sendError.status === 401) {
        await ctx.runMutation(internal.notificationDeliveries.releaseDeliveryClaim, {
          deliveryId,
        });
        console.warn('Telegram token refused mid-run');
        return { ...result, stoppedBy: 'providerUnreachable' };
      } else if (sendError instanceof TelegramAnswerError && sendError.status === 403) {
        await ctx.runMutation(internal.userMessageChannels.markChannelOptOut, {
          userId: delivery.userId,
          channel: delivery.channel,
          optOutAt: Date.now(),
        });
        await ctx.runMutation(internal.notificationDeliveries.confirmDeliveryFailed, {
          deliveryId,
          failure: 'providerRejected',
        });
        result.failed += 1;
      } else if (isFinalRefusal(sendError) || delivery.attempts + 1 >= maxDeliveryAttempts) {
        const failure = isFinalRefusal(sendError) ? 'providerRejected' : 'sendAttemptsExhausted';
        console.warn('Delivery send failed', deliveryId, failure);
        await ctx.runMutation(internal.notificationDeliveries.confirmDeliveryFailed, {
          deliveryId,
          failure,
        });
        result.failed += 1;
      } else {
        console.warn('Delivery send failed', deliveryId, 'transient');
        await ctx.runMutation(internal.notificationDeliveries.releaseDeliveryClaim, {
          deliveryId,
        });
      }
    }
    return result;
  },
});
