import { describe, expect, test } from 'vitest';
import { requiredBrazilianMobilePhone } from './fields';

describe('requiredBrazilianMobilePhone', () => {
  test('takes an area code and nine digits starting with 9', () => {
    expect(requiredBrazilianMobilePhone.safeParse('85987654321').success).toBe(true);
  });

  test('refuses a landline (eight digits after the area code)', () => {
    expect(requiredBrazilianMobilePhone.safeParse('8532345678').success).toBe(false);
  });

  test('refuses a number without the leading 9', () => {
    expect(requiredBrazilianMobilePhone.safeParse('85887654321').success).toBe(false);
  });
});
