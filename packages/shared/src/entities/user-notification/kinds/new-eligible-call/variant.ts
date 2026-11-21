import { z } from 'zod';
import { documentId } from '../../../../primitives/code/id/fields';
import { UserNotificationIdentityFields } from '../../fragments/identity/fields';

/** A match reached `eligible` or `almost`: what changed for the user is the match status. */
export const NewEligibleCallNotificationSchema = z.object({
  kind: z.literal('newEligibleCall'),
  ...UserNotificationIdentityFields.shape,
  callNoticeId: documentId('callNotices'),
  /** Which sentence the inbox builds and which send the delivery makes. */
  matchStatus: z.enum(['eligible', 'almost']),
});
