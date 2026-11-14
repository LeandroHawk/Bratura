import { NvoipTokenResponseSchema } from './payload';

const nvoipTimeoutMs = 15_000;

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
  if (!response.ok) throw new Error(`Nvoip answered HTTP ${response.status}`);
  return NvoipTokenResponseSchema.parse(await response.json()).access_token;
}
