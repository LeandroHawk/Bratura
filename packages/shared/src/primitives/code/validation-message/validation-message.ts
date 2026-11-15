/**
 * The rules of our own that a person can break in a form. A field names its rule with
 * `validationMessage('<key>')`; the text per locale is in `src/messages/`, which must cover every
 * key here.
 */
export type ValidationMessageKey =
  | 'cpf'
  | 'cep'
  | 'brazilianMobilePhone'
  | 'confirmationDiffers'
  | 'endsBeforeItStarts'
  | 'yearInTheFuture';

/** The second argument of a `.refine`: the issue then carries the key, never a text. */
export function validationMessage(key: ValidationMessageKey) {
  return { params: { message: key } };
}
