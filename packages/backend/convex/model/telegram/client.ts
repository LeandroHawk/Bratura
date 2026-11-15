import {
  TelegramGetMeResultSchema,
  TelegramResultEnvelopeSchema,
  TelegramSendMessageResultSchema,
} from './payload';

const telegramTimeoutMs = 15_000;
const telegramBaseUrl = 'https://api.telegram.org';
const answerExcerptMaxLength = 300;

/**
 * A non-2xx Telegram answer: `status` is what the outbox reads to tell a refusal (4xx, never
 * retried) from a transient failure (429, 5xx, no answer). The body excerpt stays in the logs;
 * it may echo the chat and never reaches a table.
 */
export class TelegramAnswerError extends Error {
  constructor(
    public readonly status: number,
    excerpt: string,
  ) {
    super(`Telegram answered HTTP ${status}${excerpt ? `: ${excerpt}` : ''}`);
    this.name = 'TelegramAnswerError';
  }
}

async function telegramAnswerError(response: Response): Promise<TelegramAnswerError> {
  const body = (await response.text().catch(() => '')).replace(/\s+/g, ' ').trim();
  const excerpt =
    body.length > answerExcerptMaxLength ? `${body.slice(0, answerExcerptMaxLength)}…` : body;
  return new TelegramAnswerError(response.status, excerpt);
}

/**
 * Calls a Bot API method: `POST /bot<token>/<method>`, JSON body, timeout on every call. Any
 * 2xx returns the parsed envelope; a non-2xx or no answer throws `TelegramAnswerError`.
 */
async function callTelegram(
  token: string,
  method: string,
  body?: Record<string, unknown>,
): Promise<unknown> {
  const response = await fetch(`${telegramBaseUrl}/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? '{}' : JSON.stringify(body),
    signal: AbortSignal.timeout(telegramTimeoutMs),
  });
  if (!response.ok) throw await telegramAnswerError(response);
  const envelope = TelegramResultEnvelopeSchema.safeParse(await response.json().catch(() => null));
  return envelope.success ? envelope.data.result : undefined;
}

/**
 * `getMe`: proves a `TELEGRAM_BOT_TOKEN` is real and returns who the bot is; sends nothing.
 */
export async function fetchTelegramBot({
  token,
}: {
  token: string;
}): Promise<{ id: number; username: string | null }> {
  const result = TelegramGetMeResultSchema.parse(await callTelegram(token, 'getMe'));
  return { id: result.id, username: result.username ?? null };
}

/**
 * `sendMessage` (`docs/integrations/telegram.md`): plain text, no parse mode, so user content can
 * never break markup. Any 2xx is a send — the message id is returned when the body carries one
 * and `null` for any other shape; only a non-2xx or no answer throws.
 */
export async function sendTelegramMessage({
  token,
  chatId,
  text,
}: {
  token: string;
  /** The chat the user opened with the bot, resolved from `users` at send time. */
  chatId: string;
  text: string;
}): Promise<string | null> {
  const result = await callTelegram(token, 'sendMessage', { chat_id: chatId, text });
  const parsed = TelegramSendMessageResultSchema.safeParse(result);
  return parsed.success ? String(parsed.data.message_id) : null;
}
