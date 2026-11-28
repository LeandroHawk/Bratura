/**
 * The rules of our own that a person can break in a form. A `.refine` names its rule with
 * `validationMessage('<key>')`; a schema whose own issue says the rule (an enum, a union) names it
 * with `.meta({ validationMessage: '<key>' })`. The text per locale is in `src/messages/`.
 */
export type ValidationMessageKey =
  | 'clearanceWithoutValidity'
  | 'endsBeforeItStarts'
  | 'yearInTheFuture'
  | 'fileTooLarge'
  | 'videoTooLong'
  | 'unsupportedFileType'
  | 'notAnImage'
  | 'unreadableFile';

declare module 'zod' {
  interface GlobalMeta {
    /** A misspelled key fails `tsc` instead of showing the generic message. */
    validationMessage?: ValidationMessageKey;
  }
}

/** The second argument of a `.refine`: the issue then carries the key, never a text. */
export function validationMessage(key: ValidationMessageKey) {
  return { params: { message: key } };
}
