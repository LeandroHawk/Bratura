import { z } from 'zod';
import { documentId } from '../../../../primitives/code/id/fields';
import { requiredInstant } from '../../../../primitives/code/time/instant/fields';
import { UserNotificationIdentityFields } from '../../fragments/identity/fields';

/** A call notice the user follows changed at the source (a moved deadline, a new document). */
export const CallNoticeAmendedNotificationSchema = z.object({
  kind: z.literal('callNoticeAmended'),
  ...UserNotificationIdentityFields.shape,
  callNoticeId: documentId('callNotices'),
  /** When the change was seen at the source. */
  amendedAt: requiredInstant,
});
