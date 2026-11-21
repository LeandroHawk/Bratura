import { describe, expect, test } from 'vitest';
import { abacatePaySecretMatches, abacatePaySignatureMatches } from './signature';

const utf8 = new TextEncoder();

// HMAC-SHA256 of `fixtureBody` under AbacatePay's documented public key, computed with Node's
// crypto (an implementation other than ours), so the check verifies our decoding and compare.
const fixtureBody = utf8.encode(
  '{"id":"log_test123","event":"subscription.completed","apiVersion":2,"devMode":true,"data":{}}',
);
const fixtureSignature = 'IwdH+CMPKKwqT0Nwt64xN4GPK1Cur/WNImQCGFJj7N8=';

describe('abacatePaySignatureMatches', () => {
  test('accepts the HMAC-SHA256 of the raw body', async () => {
    expect(await abacatePaySignatureMatches(fixtureBody, fixtureSignature)).toBe(true);
  });

  test('rejects the same signature over a body one byte different', async () => {
    const tampered = utf8.encode(
      '{"id":"log_test124","event":"subscription.completed","apiVersion":2,"devMode":true,"data":{}}',
    );
    expect(await abacatePaySignatureMatches(tampered, fixtureSignature)).toBe(false);
  });

  test('rejects a header that is not base64, or is empty', async () => {
    expect(await abacatePaySignatureMatches(fixtureBody, 'not-base64!')).toBe(false);
    expect(await abacatePaySignatureMatches(fixtureBody, '')).toBe(false);
  });
});

describe('abacatePaySecretMatches', () => {
  test('equal secrets match; a different or empty one does not', () => {
    const secret = 'f72179170ec5a0c845c0fcd18457e241006d09363b2d2a7d296d7bffbcd027c4';
    expect(abacatePaySecretMatches(secret, secret)).toBe(true);
    expect(abacatePaySecretMatches(`${secret}x`, secret)).toBe(false);
    expect(abacatePaySecretMatches('', secret)).toBe(false);
  });
});
