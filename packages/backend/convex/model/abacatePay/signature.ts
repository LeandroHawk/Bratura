// Webhook delivery proofs (`docs/integrations/abacate-pay.md`): the secret in the URL or the
// `X-Webhook-Secret` header proves origin, and `X-Webhook-Signature` (HMAC-SHA256 over the raw
// body, base64) proves the body arrived intact. Both are compared in constant time.

/**
 * The key AbacatePay signs every delivery with: public, the same for every account, and no
 * relation to our webhook secret (`docs.abacatepay.com`, Segurança dos webhooks). Because it is
 * public the signature only proves integrity — the secret is what proves origin.
 */
const abacatePayWebhookPublicKey =
  't9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9';

const utf8 = new TextEncoder();
const base64Digits = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

/** Standard base64 → bytes; `null` on anything outside the alphabet (padding allowed). */
function decodeBase64(value: string): Uint8Array | null {
  const digits = value.replace(/=+$/, '');
  if (digits.length === 0) return null;
  const bytes: number[] = [];
  let buffer = 0;
  let heldBits = 0;
  for (const char of digits) {
    const digit = base64Digits.indexOf(char);
    if (digit === -1) return null;
    buffer = (buffer << 6) | digit;
    heldBits += 6;
    if (heldBits >= 8) {
      heldBits -= 8;
      bytes.push((buffer >> heldBits) & 0xff);
    }
  }
  return Uint8Array.from(bytes);
}

/**
 * A length-first, constant-time comparison: a plain `===` answers faster when the first
 * characters already differ, which helps guess a secret one prefix at a time.
 */
function equalInConstantTime(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a[index]! ^ b[index]!;
  }
  return difference === 0;
}

/** Whether the secret a delivery carried equals ours: from `X-Webhook-Secret` or the URL. */
export function abacatePaySecretMatches(received: string, expected: string): boolean {
  return equalInConstantTime(utf8.encode(received), utf8.encode(expected));
}

/**
 * Whether `X-Webhook-Signature` is the HMAC-SHA256 of this exact raw body: computed over the
 * bytes as they arrived — a parsed and re-serialized JSON would no longer match.
 */
export async function abacatePaySignatureMatches(
  rawBody: Uint8Array<ArrayBuffer>,
  signatureHeader: string,
): Promise<boolean> {
  const received = decodeBase64(signatureHeader);
  if (received === null) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    utf8.encode(abacatePayWebhookPublicKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const expected = new Uint8Array(await crypto.subtle.sign('HMAC', key, rawBody));
  return equalInConstantTime(expected, received);
}
