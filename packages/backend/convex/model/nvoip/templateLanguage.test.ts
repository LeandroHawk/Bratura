import { describe, expect, test } from 'vitest';
import { templateLanguageFromLocale } from './templateLanguage';

describe('templateLanguageFromLocale', () => {
  test('maps each locale to the language the template was approved under', () => {
    expect(templateLanguageFromLocale('pt-BR')).toBe('pt_BR');
    expect(templateLanguageFromLocale('en')).toBe('en_US');
  });
});
