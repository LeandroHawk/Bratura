import { z } from 'zod';
import { documentId } from '../../primitives/code/id/fields';
import { requiredString } from '../../primitives/code/string/fields';
import { requiredInstant } from '../../primitives/code/time/instant/fields';
import { DeliveryChannelEnum } from '../notification-delivery/enums/delivery-channel/enum';

/**
 * How to reach a user on one message channel: one row per user per channel, the user's opt-in
 * (`optInAt`) and opt-out (`optOutAt`). `destination` is the channel's opaque address (Telegram's
 * `chat_id`, WhatsApp's phone when it returns) — the only table that holds it, so erasing a
 * user's data has one place. Writes: `userMessageChannels.ts` (and the inbound webhook later).
 * Comes from: the user opening the channel with us.
 */
export const UserMessageChannelSchema = z.object({
  userId: documentId('users'),
  channel: DeliveryChannelEnum,
  destination: requiredString('short'),
  optInAt: requiredInstant,
  optOutAt: requiredInstant.nullable(),
});

export type UserMessageChannel = z.infer<typeof UserMessageChannelSchema>;
