import { z } from 'zod';
import { requiredString, type TextLength } from '../../../../primitives/code/string/fields';
import { UserNotificationIdentityFields } from '../../fragments/identity/fields';

// `ptBR`, not `pt-BR`: Convex object keys must be alphanumeric identifiers, so the BCP 47 tag
// cannot key the field.
const localizedText = (length: TextLength) =>
  z.object({ ptBR: requiredString(length), en: requiredString(length) });

/**
 * A message from the team to users, the only kind that stores its own text: nothing renders it
 * from another row. Both locales are written at announce time, like every copy in the product.
 */
export const PlatformAnnouncementNotificationSchema = z.object({
  kind: z.literal('platformAnnouncement'),
  ...UserNotificationIdentityFields.shape,
  title: localizedText('medium'),
  body: localizedText('long'),
});
