import { z } from 'zod';

/** The OAuth2 token answer (client credentials), with only what we read. */
export const NvoipTokenResponseSchema = z.object({
  access_token: z.string().min(1),
});

/**
 * A template send's answer: v3 may return the provider's `message_id` (a `wamid`), which the
 * alert keeps for delivery tracking. `null` when the answer does not carry one.
 */
export const NvoipTemplateSendResponseSchema = z.object({
  message_id: z.string().min(1).nullish(),
});
