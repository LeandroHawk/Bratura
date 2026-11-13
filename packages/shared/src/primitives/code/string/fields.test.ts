import { describe, expect, test } from 'vitest';
import { nullableString, requiredString, textLengths } from './fields';

describe('requiredString', () => {
  test('drops surrounding spaces', () => {
    expect(requiredString().parse('  Teatro  ')).toBe('Teatro');
  });

  test('refuses text made only of spaces', () => {
    expect(requiredString().safeParse('   ').success).toBe(false);
  });

  test('counts the ceiling after trimming', () => {
    const atCeiling = 'a'.repeat(textLengths.short);
    expect(requiredString('short').safeParse(`  ${atCeiling}  `).success).toBe(true);
    expect(requiredString('short').safeParse(`${atCeiling}a`).success).toBe(false);
  });

  test('takes a named size, never a number', () => {
    // @ts-expect-error a ceiling is picked from textLengths, so it cannot be raised at the call site
    requiredString(1_000_000);
  });
});

describe('nullableString', () => {
  test('keeps null for text the source did not give', () => {
    expect(nullableString().parse(null)).toBeNull();
  });

  test('applies the ceiling too', () => {
    expect(nullableString('short').safeParse('a'.repeat(textLengths.short + 1)).success).toBe(
      false,
    );
  });
});
