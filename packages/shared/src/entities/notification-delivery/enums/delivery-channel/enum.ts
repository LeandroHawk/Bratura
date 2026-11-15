import { z } from 'zod';

/** How a notification can leave the site: Telegram only, until e-mail (Resend) lands. */
export const DeliveryChannelEnum = z.enum(['telegram']);

export type DeliveryChannel = z.infer<typeof DeliveryChannelEnum>;
