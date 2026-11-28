import type { AttachedFileInputSchema } from '@/features/portfolio/pages/sections/common/attached-files/attached-file.mapper';
import type { ParsedWithMessages } from '@bratura/shared/messages/messages';
import type { AttachedFile } from '@bratura/shared/primitives/domain/attached-file/fields';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import {
  amountInCentsFromInput,
  linkFromInput,
  linksFromInput,
  inputFromLinks,
  listFromInput,
  nullableTextFromInput,
  peopleFromInput,
} from '@/features/common/utils/form-text';
import { PORTFOLIO_COMMON_CONTENT } from './content';

/**
 * How one field of the contract is typed in a form. `lines` and `links` are lists typed one per
 * line, `people` one "name, role" per line; `amount` is typed in reais and kept in cents; `yesNo`
 * is a yes, a no or no answer; `file` keeps one attached file, `files` several.
 */
export type FormFieldControl =
  | 'text'
  | 'textarea'
  | 'date'
  | 'year'
  | 'amount'
  | 'yesNo'
  | 'people'
  | 'select'
  | 'checkboxes'
  | 'lines'
  | 'links'
  | 'file'
  | 'files';

export type FormField<Name extends string = string> = {
  name: Name;
  /** The contract refuses it empty; the others are marked optional. */
  isRequired?: boolean;
  /** Takes the form's full width. */
  isWide?: boolean;
  /** For `select` and `checkboxes`: the contract's values and their names for the reader. */
  options?: { values: readonly string[]; labels: Record<string, string> };
} & (
  | { control: 'file' | 'files'; fileSchema: AttachedFileInputSchema }
  | { control: Exclude<FormFieldControl, 'file' | 'files'>; fileSchema?: never }
);

/** What the controls hold while the person types. */
export type FormDraft = Record<string, string | string[] | AttachedFile[]>;

/** A stored record as the controls show it. */
export function draftFromValues(fields: FormField[], values: Record<string, unknown>): FormDraft {
  const draft: FormDraft = {};
  for (const { name, control } of fields) {
    const value = values[name];
    if (control === 'checkboxes' || control === 'files') draft[name] = (value ?? []) as string[];
    else if (control === 'file') draft[name] = value ? [value as AttachedFile] : [];
    else if (control === 'lines') draft[name] = ((value ?? []) as string[]).join('\n');
    else if (control === 'links') draft[name] = inputFromLinks((value ?? []) as string[]);
    else if (control === 'people')
      draft[name] = ((value ?? []) as { name: string; role: string }[])
        .map(({ name: person, role }) => `${person}, ${role}`)
        .join('\n');
    else if (control === 'amount')
      draft[name] = typeof value === 'number' ? (value / 100).toFixed(2).replace('.', ',') : '';
    else if (control === 'yesNo')
      draft[name] = value === true ? 'yes' : value === false ? 'no' : '';
    else draft[name] = value === null || value === undefined ? '' : String(value);
  }
  return draft;
}

/** What was typed, in the contract's types; whether it is valid is the schema's call. */
export function valuesFromDraft(fields: FormField[], draft: FormDraft): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const { name, control } of fields) {
    const typed = draft[name];
    if (typeof typed !== 'string') values[name] = control === 'file' ? (typed?.[0] ?? null) : typed;
    else if (control === 'lines') values[name] = listFromInput(typed);
    else if (control === 'links') values[name] = linksFromInput(typed).map(linkFromInput);
    else if (control === 'year') values[name] = typed.trim() === '' ? null : Number(typed);
    else if (control === 'amount') values[name] = amountInCentsFromInput(typed);
    else if (control === 'people') values[name] = peopleFromInput(typed);
    else if (control === 'yesNo') values[name] = typed === '' ? null : typed === 'yes';
    else values[name] = nullableTextFromInput(typed);
  }
  return values;
}

/** A typed record checked against the contract; an amount that is not in reais is said first. */
export function parseRecordDraft<Value>({
  fields,
  draft,
  parse,
  locale,
}: {
  fields: FormField[];
  draft: FormDraft;
  parse: (values: Record<string, unknown>) => ParsedWithMessages<Value>;
  locale: Locale;
}): ParsedWithMessages<Value> {
  const unreadAmount = fields.find(
    ({ name, control }) =>
      control === 'amount' &&
      typeof draft[name] === 'string' &&
      Number.isNaN(amountInCentsFromInput(draft[name])),
  );
  if (unreadAmount)
    return {
      success: false,
      messageByPath: { [unreadAmount.name]: PORTFOLIO_COMMON_CONTENT[locale].invalidAmount },
    };
  return parse(valuesFromDraft(fields, draft));
}

/** The message of a field or, for a list, of its first entry that failed (`links.2`). */
export function fieldMessage(messageByPath: Record<string, string>, name: string) {
  if (messageByPath[name]) return messageByPath[name];
  const entry = Object.keys(messageByPath).find((path) => path.startsWith(`${name}.`));
  return entry ? messageByPath[entry] : undefined;
}

/** Adds a completed batch to the current draft, preserving removals and other completed batches. */
export function draftWithKeptFiles(
  current: FormDraft,
  name: string,
  kept: AttachedFile[],
  several: boolean,
): FormDraft {
  return {
    ...current,
    [name]: several ? [...(current[name] as AttachedFile[]), ...kept] : kept.slice(-1),
  };
}
