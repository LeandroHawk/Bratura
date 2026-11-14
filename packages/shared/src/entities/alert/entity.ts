import { z } from 'zod';
import { nullableString } from '../../primitives/code/string/fields';
import { requiredInstant } from '../../primitives/code/time/instant/fields';
import { AlertDeliveryFields } from './fragments/delivery/fields';
import { AlertIdentityFields } from './fragments/identity/fields';

/** Why a send failed, as a code: the provider's own text stays in the logs, never in a table. */
export const AlertFailureEnum = z.enum(['providerError', 'channelUnavailable']);
export type AlertFailure = z.infer<typeof AlertFailureEnum>;

const alertFields = {
  ...AlertIdentityFields.shape,
  ...AlertDeliveryFields.shape,
};

/** Reserved by a trigger, waiting for its send (outbox: reserve → act → confirm). */
export const SendingAlertSchema = z.object({
  ...alertFields,
  status: z.literal('sending'),
  sendingSince: requiredInstant,
});

/** Confirmed by the channel; `providerMessageId` is Nvoip's `message_id` when it answers one. */
export const SentAlertSchema = z.object({
  ...alertFields,
  status: z.literal('sent'),
  sentAt: requiredInstant,
  providerMessageId: nullableString('medium'),
});

export const FailedAlertSchema = z.object({
  ...alertFields,
  status: z.literal('failed'),
  failedAt: requiredInstant,
  failure: AlertFailureEnum,
});

/**
 * One message to one creator. Nothing reaches a phone or an inbox without a row here: a trigger
 * reserves it (`sending`), the send action delivers it through the channel adapter, a mutation
 * confirms it (`sent` or `failed`). Writes: `alerts.ts` only. Reads: the send action and, later,
 * the admin review.
 */
export const AlertSchema = z.discriminatedUnion('status', [
  SendingAlertSchema,
  SentAlertSchema,
  FailedAlertSchema,
]);

export type Alert = z.infer<typeof AlertSchema>;
