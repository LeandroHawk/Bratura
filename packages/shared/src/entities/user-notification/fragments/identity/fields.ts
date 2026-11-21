import { z } from 'zod';
import { documentId } from '../../../../primitives/code/id/fields';
import { requiredString } from '../../../../primitives/code/string/fields';

/**
 * Writes: a trigger (matching, the deadline cron, an admin announcement), through
 * `userNotifications.ts`. Comes from: the event that fired it. `dedupeKey` is the trigger's
 * natural key — one notification per user per key, so the same event never notifies twice.
 */
export const UserNotificationIdentityFields = z.object({
  /** Whose notification: a `users` row (WorkOS supplies the identity when login lands). */
  userId: documentId('users'),
  /** The trigger's key ('deadlineSoon:d7:<callNoticeId>'): a repeat of it finds the same row. */
  dedupeKey: requiredString('short'),
});
