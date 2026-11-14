import { httpAnswerError } from '../../lib/httpError';
import { NvoipTemplateSendResponseSchema, NvoipTokenResponseSchema } from './payload';
import type { NvoipTemplateLanguage } from './templateLanguage';

const nvoipTimeoutMs = 15_000;
const nvoipBaseUrl = 'https://api.nvoip.com.br/v3';

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
  if (!response.ok) throw await httpAnswerError('Nvoip', response);
  return NvoipTokenResponseSchema.parse(await response.json()).access_token;
}

export type NvoipTemplateSend = {
  accessToken: string;
  /** The approved template's name on the Nvoip account. */
  templateId: string;
  /** A phone: an optional '+' then 8–20 digits (Nvoip's rule; BSUID recipients come later). */
  destination: string;
  /** The WhatsApp instance that sends, from `NVOIP_WA_INSTANCE` — v3 still asks for it per send. */
  instance: string;
  language: NvoipTemplateLanguage;
  /** Positional values for the template's {{1}}, {{2}}… placeholders; omit when it has none. */
  bodyVariables?: string[];
};

/**
 * Sends an approved template (`POST /v3/wa/sendTemplates`). Returns the provider's message id
 * (`wamid`) when the answer carries one, `null` otherwise.
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
  if (!response.ok) throw await httpAnswerError('Nvoip', response);
  return NvoipTemplateSendResponseSchema.parse(await response.json()).message_id ?? null;
}
