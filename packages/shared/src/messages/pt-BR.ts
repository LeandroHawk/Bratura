import type { ValidationMessageKey } from '../primitives/code/validation-message/validation-message';

/** The pt-BR object is the shape: `en.ts` must carry the same keys. */
export const ptBRValidationMessages = {
  required: 'Preencha este campo.',
  chooseAnOption: 'Escolha uma opção da lista.',
  email: 'Digite um e-mail completo, como nome@exemplo.com.',
  link: 'Digite o endereço completo, começando com https://.',
  date: 'Digite uma data válida.',
  wholeNumber: 'Digite um número inteiro.',
  invalid: 'Confira este campo.',
  textTooShort: (minimum: number) => `Use pelo menos ${minimum} caracteres.`,
  textTooLong: (maximum: number) => `Use no máximo ${maximum} caracteres.`,
  numberTooSmall: (minimum: number) => `O menor valor aceito é ${minimum}.`,
  numberTooBig: (maximum: number) => `O maior valor aceito é ${maximum}.`,
  listTooLong: (maximum: number) => `Mantenha no máximo ${maximum} itens.`,
  rule: {
    endsBeforeItStarts: 'O término não pode vir antes do início.',
    yearInTheFuture: 'Esse ano ainda não chegou.',
  } satisfies Record<ValidationMessageKey, string>,
};

export type ValidationMessages = typeof ptBRValidationMessages;
