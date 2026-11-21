import { z } from 'zod';
import { documentId } from '../../../../primitives/code/id/fields';
import { UserNotificationIdentityFields } from '../../fragments/identity/fields';

/** A reminder of a call's closing window: `occurrence` is which marker of it this is. */
export const DeadlineSoonNotificationSchema = z.object({
  kind: z.literal('deadlineSoon'),
  ...UserNotificationIdentityFields.shape,
  callNoticeId: documentId('callNotices'),
  occurrence: z.enum(['d7', 'd1']),
});
