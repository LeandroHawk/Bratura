import { z } from 'zod';

/** How a notification can leave the site: WhatsApp only, until e-mail (Resend) lands. */
export const DeliveryChannelEnum = z.enum(['whatsapp']);

export type DeliveryChannel = z.infer<typeof DeliveryChannelEnum>;
