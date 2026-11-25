import { z } from 'zod';
import { MatchClassificationEnum } from '../../../match/enums/classification/enum';
import { documentId } from '../../../../primitives/code/id/fields';
import { UserNotificationIdentityFields } from '../../fragments/identity/fields';

/** A match reached `eligible` or `almostEligible`: what changed for the user is its status. */
export const NewEligibleCallNotificationSchema = z.object({
  kind: z.literal('newEligibleCall'),
  ...UserNotificationIdentityFields.shape,
  callNoticeId: documentId('callNotices'),
  /** Which sentence the inbox builds and which send the delivery makes. */
  matchStatus: MatchClassificationEnum.extract(['eligible', 'almostEligible']),
});
