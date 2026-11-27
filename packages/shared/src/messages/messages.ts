import type { z } from 'zod';
import type { Locale } from '../primitives/external/locale/enum';
import type { ValidationMessageKey } from '../primitives/code/validation-message/validation-message';
import { enValidationMessages } from './en';
import { ptBRValidationMessages, type ValidationMessages } from './pt-BR';

const MESSAGES: Record<Locale, ValidationMessages> = {
  'pt-BR': ptBRValidationMessages,
  en: enValidationMessages,
};

const isEmpty = (input: unknown) => input === undefined || input === null || input === '';

function messageFromIssue(issue: z.core.$ZodRawIssue, messages: ValidationMessages): string {
  // An empty field breaks whatever rule comes first; the person only needs "fill this in".
  if (isEmpty(issue.input)) {
    return issue.code === 'invalid_value' ? messages.chooseAnOption : messages.required;
  }
  switch (issue.code) {
    case 'too_small': {
      const minimum = Number(issue.minimum);
      if (issue.origin === 'string')
        return minimum === 1 ? messages.required : messages.textTooShort(minimum);
      return messages.numberTooSmall(minimum);
    }
    case 'too_big': {
      const maximum = Number(issue.maximum);
      if (issue.origin === 'string') return messages.textTooLong(maximum);
      if (issue.origin === 'array') return messages.listTooLong(maximum);
      return messages.numberTooBig(maximum);
    }
    case 'invalid_format':
      if (issue.format === 'email') return messages.email;
      if (issue.format === 'url') return messages.link;
      if (issue.format === 'date') return messages.date;
      return messages.invalid;
    case 'invalid_value':
      return messages.chooseAnOption;
    case 'invalid_type':
      return issue.expected === 'int' || issue.expected === 'number'
        ? messages.wholeNumber
        : messages.invalid;
    case 'custom': {
      const key: unknown = issue.params?.message;
      return typeof key === 'string' && key in messages.rule
        ? messages.rule[key as keyof ValidationMessages['rule']]
        : messages.invalid;
    }
    default:
      return messages.invalid;
  }
}

export type ParsedWithMessages<Value> =
  | { success: true; value: Value }
  /** One text per field that failed, keyed by its path joined with dots (`links.2`). */
  | { success: false; messageByPath: Record<string, string> };

/**
 * Parses what a person typed and, when it fails, says why in their language: the first issue of
 * each field, as text ready to show under it. Where a form meets the contract.
 */
export function parseWithMessages<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
  locale: Locale,
): ParsedWithMessages<z.output<Schema>> {
  const messages = MESSAGES[locale];
  const result = schema.safeParse(input, { error: (issue) => messageFromIssue(issue, messages) });
  if (result.success) return { success: true, value: result.data };
  const messageByPath: Record<string, string> = {};
  for (const issue of result.error.issues) messageByPath[issue.path.join('.')] ??= issue.message;
  return { success: false, messageByPath };
}

/** The text of a rule of our own, for a check no schema runs (an image the browser cannot draw). */
export function ruleMessage(key: ValidationMessageKey, locale: Locale): string {
  return MESSAGES[locale].rule[key];
}
