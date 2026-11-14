import { z } from 'zod';

/**
 * How an alert reaches the creator: WhatsApp through Nvoip today, e-mail (Resend) when e-mail
 * alerts land. One channel per alert: the writer resolves the creator's preferred one.
 */
export const AlertChannelEnum = z.enum(['whatsapp', 'email']);

export type AlertChannel = z.infer<typeof AlertChannelEnum>;
