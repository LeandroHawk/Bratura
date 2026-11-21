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
    endsBeforeItStarts: 'The end cannot come before the start.',
    yearInTheFuture: 'That year has not come yet.',
  },
};
