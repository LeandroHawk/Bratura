import { z } from 'zod';
import { documentId } from '../../primitives/code/id/fields';
import { nullableString } from '../../primitives/code/string/fields';
import { requiredInstant } from '../../primitives/code/time/instant/fields';
import { DeliveryChannelEnum } from './enums/delivery-channel/enum';
import { NotificationDeliveryReservationFields } from './fragments/reservation/fields';

/**
 * Why a delivery stopped for good, as a code: a provider's own text stays in the logs. Transient
 * failures (timeout, 5xx, 429) never reach this enum — they release the claim and retry.
 */
export const NotificationDeliveryFailureEnum = z.enum([
  'providerRejected',
  'sendAttemptsExhausted',
]);
export type NotificationDeliveryFailure = z.infer<typeof NotificationDeliveryFailureEnum>;

const identityFields = {
  /** The notification this send delivers. */
  notificationId: documentId('userNotifications'),
  /** The recipient: the phone resolves from it at send time and keys the per-recipient cap. */
  userId: documentId('users'),
  channel: DeliveryChannelEnum,
};

/** Claimed by a send run, or waiting for one (outbox pattern). */
export const SendingNotificationDeliverySchema = z.object({
  ...identityFields,
  status: z.literal('sending'),
  ...NotificationDeliveryReservationFields.shape,
});

export const SentNotificationDeliverySchema = z.object({
  ...identityFields,
  status: z.literal('sent'),
  sentAt: requiredInstant,
  /** The provider's message id when its answer carried one. */
  providerMessageId: nullableString('medium'),
});

export const FailedNotificationDeliverySchema = z.object({
  ...identityFields,
  status: z.literal('failed'),
  failedAt: requiredInstant,
  failure: NotificationDeliveryFailureEnum,
});

/**
 * Writes: `notificationDeliveries.ts`, the only writer. Comes from: `userNotifications.notify`,
 * which reserves one per opted-in recipient; a send run confirms it. Personal data stays out:
 * the phone is resolved from `userId` at send time (`docs/security.md` §4).
 */
export const NotificationDeliverySchema = z.discriminatedUnion('status', [
  SendingNotificationDeliverySchema,
  SentNotificationDeliverySchema,
  FailedNotificationDeliverySchema,
]);

export type NotificationDelivery = z.infer<typeof NotificationDeliverySchema>;
