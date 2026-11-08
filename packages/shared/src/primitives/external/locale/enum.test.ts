import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, LocaleEnum } from './enum';

describe('LocaleEnum', () => {
  it('accepts the BCP 47 tags the product is written in', () => {
    expect(LocaleEnum.options).toEqual(['pt-BR', 'en']);
    expect(LocaleEnum.safeParse(DEFAULT_LOCALE).success).toBe(true);
  });

  it.each(['pt', 'pt-br', 'en-US', ''])('rejects %j, which is not one of them', (tag) => {
    expect(LocaleEnum.safeParse(tag).success).toBe(false);
  });
});
