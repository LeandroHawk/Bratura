import { z } from 'zod';

/**
 * How a notification can leave the site: Telegram only, until e-mail (Resend) or WhatsApp
 * lands. A primitive: `notification-delivery` and `user-message-channel` share it and neither
 * owns the decision of which channels exist (`packages/shared/AGENTS.md`, Entity or primitive).
 */
export const DeliveryChannelEnum = z.enum(['telegram']);

export type DeliveryChannel = z.infer<typeof DeliveryChannelEnum>;
