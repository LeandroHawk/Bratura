import { z } from 'zod';
import { requiredInstant } from '../../primitives/code/time/instant/fields';
import { CallNoticeAmendedNotificationSchema } from './kinds/call-notice-amended/variant';
import { DeadlineSoonNotificationSchema } from './kinds/deadline-soon/variant';
import { NewEligibleCallNotificationSchema } from './kinds/new-eligible-call/variant';
import { PlatformAnnouncementNotificationSchema } from './kinds/platform-announcement/variant';

/**
 * What to tell a user and to whom: the web inbox's row. It stores parameters, never rendered
 * text — the web builds the sentence from its own copy (`platform-announcement` carries its own
 * text in both locales, the one kind with nothing to render from). It knows nothing about a
 * channel: how it left the site is a `notification-delivery`, one row per send.
 */
const readStateFields = {
  /** When the user read it in the web inbox; `null` while unread. */
  readAt: requiredInstant.nullable(),
};

export const UserNotificationSchema = z.discriminatedUnion('kind', [
  NewEligibleCallNotificationSchema.extend(readStateFields),
  DeadlineSoonNotificationSchema.extend(readStateFields),
  CallNoticeAmendedNotificationSchema.extend(readStateFields),
  PlatformAnnouncementNotificationSchema.extend(readStateFields),
]);

export type UserNotification = z.infer<typeof UserNotificationSchema>;

/** What a trigger writes through `userNotifications.notify`: the row without its read state. */
export const UserNotificationDraftSchema = z.discriminatedUnion('kind', [
  NewEligibleCallNotificationSchema,
  DeadlineSoonNotificationSchema,
  CallNoticeAmendedNotificationSchema,
  PlatformAnnouncementNotificationSchema,
]);

export type UserNotificationDraft = z.infer<typeof UserNotificationDraftSchema>;
