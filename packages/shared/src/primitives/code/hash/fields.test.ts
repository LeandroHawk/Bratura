import { describe, expect, test } from 'vitest';
import { requiredSha256Hex } from './fields';

describe('requiredSha256Hex', () => {
  test('accepts a lowercase hex digest', () => {
    expect(requiredSha256Hex.safeParse('a'.repeat(64)).success).toBe(true);
  });

  test.each(['A'.repeat(64), 'a'.repeat(63), 'g'.repeat(64), ''])('refuses %s', (digest) => {
    expect(requiredSha256Hex.safeParse(digest).success).toBe(false);
  });
});
