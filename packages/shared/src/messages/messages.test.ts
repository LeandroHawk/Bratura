import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { CreatorRegistrationFields } from '../entities/creator/fragments/registration/fields';
import { validationMessage } from '../primitives/code/validation-message/validation-message';
import { enValidationMessages } from './en';
import { parseWithMessages } from './messages';
import { ptBRValidationMessages } from './pt-BR';

const filled = {
  fullName: 'Maria das Dores',
  email: 'maria@example.com',
  nationality: 'Brasileira',
  profileType: 'individual',
  mobilePhone: '85987654321',
  cpf: '52998224725',
  cep: '63010010',
  state: 'CE',
  city: 'Juazeiro do Norte',
};

function messagesOf(input: unknown, locale: 'pt-BR' | 'en' = 'pt-BR') {
  const result = parseWithMessages(CreatorRegistrationFields, input, locale);
  return result.success ? {} : result.messageByPath;
}

describe('parseWithMessages', () => {
  test('returns the parsed value when the contract holds', () => {
    const result = parseWithMessages(CreatorRegistrationFields, filled, 'pt-BR');
    expect(result).toEqual({ success: true, value: filled });
  });

  test('an empty field asks to be filled, whatever rule it broke first', () => {
    expect(messagesOf({ ...filled, fullName: '  ', email: '', cpf: '', city: undefined })).toEqual({
      fullName: ptBRValidationMessages.required,
      email: ptBRValidationMessages.required,
      cpf: ptBRValidationMessages.required,
      city: ptBRValidationMessages.required,
    });
  });

  test('an empty choice asks for an option', () => {
    expect(messagesOf({ ...filled, state: '' }).state).toBe(ptBRValidationMessages.chooseAnOption);
  });

  test('a rule of our own reads its text by key, in the reader’s language', () => {
    expect(messagesOf({ ...filled, cpf: '12345678900' }).cpf).toBe(ptBRValidationMessages.rule.cpf);
    expect(messagesOf({ ...filled, cpf: '12345678900' }, 'en').cpf).toBe(
      enValidationMessages.rule.cpf,
    );
  });

  test('a ceiling says its number', () => {
    expect(messagesOf({ ...filled, city: 'a'.repeat(65) }).city).toBe(
      ptBRValidationMessages.textTooLong(64),
    );
  });

  test('never shows Zod’s own English text', () => {
    const everyFieldWrong = Object.fromEntries(Object.keys(filled).map((key) => [key, 12]));
    for (const message of Object.values(messagesOf(everyFieldWrong)))
      expect(Object.values(ptBRValidationMessages)).toContain(message);
  });

  test('keys a nested failure by its dotted path, keeping the first issue', () => {
    const schema = z.object({ links: z.array(z.httpUrl()) }).refine(() => false, {
      path: ['links', 1],
      ...validationMessage('confirmationDiffers'),
    });
    const result = parseWithMessages(schema, { links: ['https://a.example', 'x'] }, 'en');
    expect(result).toEqual({
      success: false,
      messageByPath: { 'links.1': enValidationMessages.link },
    });
  });
});
