import {
  NvoipTemplateSendResponseSchema,
  NvoipTokenResponseSchema,
  type NvoipTemplateLanguage,
} from './payload';

const nvoipTimeoutMs = 15_000;
const nvoipBaseUrl = 'https://api.nvoip.com.br/v3';
const answerExcerptMaxLength = 300;

/**
 * A non-2xx Nvoip answer: `status` is what the outbox reads to tell a refusal (4xx, never
 * retried) from a transient failure (429, 5xx, no answer). The body excerpt stays in the logs;
 * it may echo the destination and never reaches a table.
 */
export class NvoipAnswerError extends Error {
  constructor(
    public readonly status: number,
    excerpt: string,
  ) {
    super(`Nvoip answered HTTP ${status}${excerpt ? `: ${excerpt}` : ''}`);
    this.name = 'NvoipAnswerError';
  }
}

async function nvoipAnswerError(response: Response): Promise<NvoipAnswerError> {
  const body = (await response.text().catch(() => '')).replace(/\s+/g, ' ').trim();
  const excerpt =
    body.length > answerExcerptMaxLength ? `${body.slice(0, answerExcerptMaxLength)}…` : body;
  return new NvoipAnswerError(response.status, excerpt);
}

export type NvoipCredentials = { clientId: string; clientSecret: string };

/**
 * A v3 access token, sent as `Authorization: Bearer` on every other call. The v2 user token and
 * `napikey` do not authenticate v3 (`docs/integrations/whatsapp.md`, Nvoip API).
 */
export async function fetchNvoipAccessToken({
  clientId,
  clientSecret,
}: NvoipCredentials): Promise<string> {
  const response = await fetch('https://api.nvoip.com.br/auth/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
    signal: AbortSignal.timeout(nvoipTimeoutMs),
  });
  if (!response.ok) throw await nvoipAnswerError(response);
  return NvoipTokenResponseSchema.parse(await response.json()).access_token;
}

export type NvoipTemplateSend = {
  accessToken: string;
  /** The approved template's name on the Nvoip account. */
  templateId: string;
  /** A phone: an optional '+' then 8–20 digits (Nvoip's rule; BSUID recipients come later). */
  destination: string;
  /** The WhatsApp instance that sends, from `NVOIP_WA_INSTANCE` — v3 asks for it per send. */
  instance: string;
  language: NvoipTemplateLanguage;
  /** Positional values for the template's {{1}}, {{2}}… placeholders; omit when it has none. */
  bodyVariables?: string[];
};

/**
 * Sends an approved template (`POST /v3/wa/sendTemplates`). Any 2xx is a send — the message id is
 * returned when the body carries one and `null` for any other shape; only a non-2xx or no answer
 * throws.
 */
export async function sendNvoipTemplate({
  accessToken,
  templateId,
  destination,
  instance,
  language,
  bodyVariables,
}: NvoipTemplateSend): Promise<string | null> {
  const response = await fetch(`${nvoipBaseUrl}/wa/sendTemplates`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idTemplate: templateId,
      destination,
      instance,
      language,
      ...(bodyVariables?.length ? { bodyVariables } : {}),
    }),
    signal: AbortSignal.timeout(nvoipTimeoutMs),
  });
  if (!response.ok) throw await nvoipAnswerError(response);
  try {
    return (
      NvoipTemplateSendResponseSchema.parse(JSON.parse(await response.text())).message_id ?? null
    );
  } catch {
    return null;
  }
}
