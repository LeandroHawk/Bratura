import { z } from 'zod';
import { requiredString } from '../../../../primitives/code/string/fields';
import { LocaleEnum } from '../../../../primitives/external/locale/enum';
import { AlertChannelEnum } from '../../enums/alert-channel/enum';

/**
 * Writes: the same trigger that writes the identity, resolved when the row is reserved — the row
 * is self-contained so a retry never re-resolves anything. Comes from: the creator's preferred
 * channel and locale. `destination` is a phone for WhatsApp today, an e-mail when Resend lands;
 * `variables` fills the template's placeholders, in order.
 */
export const AlertDeliveryFields = z.object({
  channel: AlertChannelEnum,
  destination: requiredString('medium'),
  locale: LocaleEnum,
  variables: z.array(requiredString('long')),
});
