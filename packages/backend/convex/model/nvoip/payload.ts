import { z } from 'zod';

/** The OAuth2 token answer (client credentials), with only what we read. */
export const NvoipTokenResponseSchema = z.object({
  access_token: z.string().min(1),
});
