import { describe, expect, test } from 'vitest';
import { requiredAmountInCents } from './fields';

describe('requiredAmountInCents', () => {
  test('accepts a whole number of cents', () => {
    expect(requiredAmountInCents.safeParse(500_000).success).toBe(true);
  });

  test.each([0, -100, 5000.5])('refuses %s', (amount) => {
    expect(requiredAmountInCents.safeParse(amount).success).toBe(false);
  });
});
