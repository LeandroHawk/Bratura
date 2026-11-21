import type { ValidationMessages } from './pt-BR';

export const enValidationMessages: ValidationMessages = {
  required: 'Fill in this field.',
  chooseAnOption: 'Choose an option from the list.',
  email: 'Type a full e-mail address, like name@example.com.',
  link: 'Type the full address, starting with https://.',
  date: 'Type a valid date.',
  wholeNumber: 'Type a whole number.',
  invalid: 'Check this field.',
  textTooShort: (minimum) => `Use at least ${minimum} characters.`,
  textTooLong: (maximum) => `Use at most ${maximum} characters.`,
  numberTooSmall: (minimum) => `The lowest value accepted is ${minimum}.`,
  numberTooBig: (maximum) => `The highest value accepted is ${maximum}.`,
  listTooLong: (maximum) => `Keep at most ${maximum} items.`,
  rule: {
    cpf: 'Type a valid CPF, with its 11 digits.',
    cep: 'Type the postal code (CEP) with its 8 digits.',
    brazilianMobilePhone: 'Type the mobile number with its area code, like (85) 98765-4321.',
    confirmationDiffers: 'The two fields must be the same.',
    endsBeforeItStarts: 'The end cannot come before the start.',
    yearInTheFuture: 'That year has not come yet.',
  },
};
