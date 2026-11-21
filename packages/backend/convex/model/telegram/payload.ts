import { z } from 'zod';

// Telegram Bot API answers: 2xx wraps data as `{ ok: true, result: … }`; an error comes non-2xx
// as `{ ok: false, error_code, description }` — the HTTP status already tells refusal from
// transient, so the body only needs `result`.

/** `getMe`'s result: the bot this token belongs to. */
export const TelegramGetMeResultSchema = z.object({
  id: z.number(),
  username: z.string().optional(),
});

/** `sendMessage`'s result: only the message id is kept, as the provider message id. */
export const TelegramSendMessageResultSchema = z.object({
  message_id: z.number(),
});

/** The `result` member of a 2xx answer, parsed loosely: an odd 2xx is still a send. */
export const TelegramResultEnvelopeSchema = z.object({ result: z.unknown().optional() });
