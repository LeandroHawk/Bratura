import { z } from 'zod';
import { AlertFailureEnum, AlertSchema } from '@bratura/shared/entities/alert/entity';
import { AlertDeliveryFields } from '@bratura/shared/entities/alert/fragments/delivery/fields';
import { AlertIdentityFields } from '@bratura/shared/entities/alert/fragments/identity/fields';
import { documentId } from '@bratura/shared/primitives/code/id/fields';
import { nullableString } from '@bratura/shared/primitives/code/string/fields';
import { ConvexError } from 'convex/values';
import { internal } from './_generated/api';
import type { Doc } from './_generated/dataModel';
import type { QueryCtx } from './_generated/server';
import { appError } from './lib/appError';
import { internalZodAction, internalZodMutation, internalZodQuery } from './lib/builders';
import { requiredEnv } from './lib/env';
import { sendTemplateMessage } from './model/messaging/sendTemplateMessage';

// The outbox every creator-facing message goes through (docs/architecture.md, Idempotency): a
// trigger reserves a row (`sending`), `sendAlert` delivers it through the channel adapter in
// `model/messaging`, a mutation confirms (`sent` or `failed`). The key — creator, call notice,
// template, occurrence — keeps a reminder from going twice. The triggers (matching, the deadline
// cron) land 19–25/11; until then the CLI reserves and sends by hand:
// `pnpm exec convex run alerts:reserveAlert '{…}'` then `alerts:sendAlert`.
// Return types are written out: this module calls its own functions through `internal`.

const knownAlert = (ctx: QueryCtx, key: z.infer<typeof AlertIdentityFields>) =>
  ctx.db
    .query('alerts')
    .withIndex('by_creator_call_template_occurrence', (index) =>
      index
        .eq('creatorId', key.creatorId)
        .eq('callNoticeId', key.callNoticeId)
        .eq('template', key.template)
        .eq('occurrence', key.occurrence),
    )
    .unique();

const ReserveAlertMutationArgsSchema = AlertIdentityFields.extend(AlertDeliveryFields.shape);
const ReserveAlertMutationReturnsSchema = documentId('alerts');
type ReserveAlertResult = z.infer<typeof ReserveAlertMutationReturnsSchema>;

/**
 * Reserves the alert before anything is sent (outbox pattern): the row's id, new or existing —
 * a second trigger with the same key finds the row and never sends twice.
 */
export const reserveAlert = internalZodMutation({
  args: ReserveAlertMutationArgsSchema,
  returns: ReserveAlertMutationReturnsSchema,
  handler: async (ctx, alert): Promise<ReserveAlertResult> => {
    const known = await knownAlert(ctx, alert);
    if (known) return known._id;
    return await ctx.db.insert('alerts', { ...alert, status: 'sending', sendingSince: Date.now() });
  },
});

const GetAlertQueryArgsSchema = z.object({ alertId: documentId('alerts') });
const GetAlertQueryReturnsSchema = AlertSchema;
type GetAlertResult = z.infer<typeof GetAlertQueryReturnsSchema>;

/** A reserved or confirmed alert, for its send. */
export const getAlert = internalZodQuery({
  args: GetAlertQueryArgsSchema,
  returns: GetAlertQueryReturnsSchema,
  handler: async (ctx, { alertId }): Promise<GetAlertResult> => {
    const alert = await ctx.db.get(alertId);
    if (!alert) throw appError({ code: 'notFound' });
    return alert;
  },
});

/** The send fields a status change keeps; the identity and delivery a row was reserved with. */
const sendFieldsOf = (alert: Doc<'alerts'>) => ({
  creatorId: alert.creatorId,
  callNoticeId: alert.callNoticeId,
  template: alert.template,
  occurrence: alert.occurrence,
  channel: alert.channel,
  destination: alert.destination,
  locale: alert.locale,
  variables: alert.variables,
});

const ConfirmAlertSentMutationArgsSchema = z.object({
  alertId: documentId('alerts'),
  providerMessageId: nullableString('medium'),
});
const ConfirmAlertSentMutationReturnsSchema = z.null();

/** Marks a reserved alert as sent (a `replace`, so `sendingSince` leaves with the status). */
export const confirmAlertSent = internalZodMutation({
  args: ConfirmAlertSentMutationArgsSchema,
  returns: ConfirmAlertSentMutationReturnsSchema,
  handler: async (ctx, { alertId, providerMessageId }): Promise<null> => {
    const alert = await ctx.db.get(alertId);
    if (!alert) throw appError({ code: 'notFound' });
    if (alert.status !== 'sending') throw appError({ code: 'conflict' });
    await ctx.db.replace(alertId, {
      ...sendFieldsOf(alert),
      status: 'sent',
      sentAt: Date.now(),
      providerMessageId,
    });
    return null;
  },
});

const ConfirmAlertFailedMutationArgsSchema = z.object({
  alertId: documentId('alerts'),
  failure: AlertFailureEnum,
});
const ConfirmAlertFailedMutationReturnsSchema = z.null();

/** Marks a reserved alert as failed, with why as a code. A failed row never resends. */
export const confirmAlertFailed = internalZodMutation({
  args: ConfirmAlertFailedMutationArgsSchema,
  returns: ConfirmAlertFailedMutationReturnsSchema,
  handler: async (ctx, { alertId, failure }): Promise<null> => {
    const alert = await ctx.db.get(alertId);
    if (!alert) throw appError({ code: 'notFound' });
    if (alert.status !== 'sending') throw appError({ code: 'conflict' });
    await ctx.db.replace(alertId, {
      ...sendFieldsOf(alert),
      status: 'failed',
      failedAt: Date.now(),
      failure,
    });
    return null;
  },
});

const SendAlertActionArgsSchema = z.object({ alertId: documentId('alerts') });
const SendAlertActionReturnsSchema = z.enum(['sent', 'failed', 'skipped']);
type SendAlertResult = z.infer<typeof SendAlertActionReturnsSchema>;

/**
 * Delivers a reserved alert through its channel and confirms the outcome. `skipped` when the row
 * is no longer `sending` (already sent or failed), so calling it twice never sends twice.
 */
export const sendAlert = internalZodAction({
  args: SendAlertActionArgsSchema,
  returns: SendAlertActionReturnsSchema,
  handler: async (ctx, { alertId }): Promise<SendAlertResult> => {
    const alert = await ctx.runQuery(internal.alerts.getAlert, { alertId });
    if (alert.status !== 'sending') return 'skipped';
    try {
      const { providerMessageId } = await sendTemplateMessage(alert, {
        clientId: requiredEnv('NVOIP_CLIENT_ID'),
        clientSecret: requiredEnv('NVOIP_CLIENT_SECRET'),
        whatsappInstance: requiredEnv('NVOIP_WA_INSTANCE'),
      });
      await ctx.runMutation(internal.alerts.confirmAlertSent, {
        alertId,
        providerMessageId,
      });
      return 'sent';
    } catch (error) {
      console.warn('Alert send failed', error);
      await ctx.runMutation(internal.alerts.confirmAlertFailed, {
        alertId,
        failure:
          error instanceof ConvexError && (error.data as { code?: string }).code === 'unavailable'
            ? 'channelUnavailable'
            : 'providerError',
      });
      return 'failed';
    }
  },
});
