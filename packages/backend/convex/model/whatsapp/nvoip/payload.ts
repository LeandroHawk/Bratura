import { z } from 'zod';

/** The OAuth2 token answer (client credentials), with only what we read. */
export const NvoipTokenResponseSchema = z.object({
  access_token: z.string().min(1),
});

/** The language codes Meta approves a WhatsApp template under, as Nvoip takes them. */
export const NvoipTemplateLanguageEnum = z.enum(['pt_BR', 'en_US']);
export type NvoipTemplateLanguage = z.infer<typeof NvoipTemplateLanguageEnum>;

/** A template send's answer: the provider's `message_id` (a `wamid`) when it carries one. */
export const NvoipTemplateSendResponseSchema = z.object({
  message_id: z.string().min(1).nullish(),
});
