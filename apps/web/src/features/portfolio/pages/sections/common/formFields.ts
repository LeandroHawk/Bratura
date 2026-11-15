import type { AttachedFile } from '@bratura/shared/primitives/domain/attached-file/fields';
import {
  linkFromInput,
  linesFromInput,
  listFromInput,
  nullableTextFromInput,
} from '@/features/common/utils/form-text';

/**
 * How one field of the contract is typed in a form. `lines` and `links` are lists typed one per
 * line; `file` keeps one attached file, `files` several.
 */
export type FormFieldControl =
  | 'text'
  | 'textarea'
  | 'date'
  | 'year'
  | 'select'
  | 'checkboxes'
  | 'lines'
  | 'links'
  | 'file'
  | 'files';

export type FormField<Name extends string = string> = {
  name: Name;
  control: FormFieldControl;
  /** The contract refuses it empty; the others are marked optional. */
  isRequired?: boolean;
  /** Takes the form's full width. */
  isWide?: boolean;
  /** For `select` and `checkboxes`: the contract's values and their names for the reader. */
  options?: { values: readonly string[]; labels: Record<string, string> };
};

/** What the controls hold while the person types. */
export type FormDraft = Record<string, string | string[] | AttachedFile[]>;

/** A stored record as the controls show it. */
export function draftFromValues(fields: FormField[], values: Record<string, unknown>): FormDraft {
  const draft: FormDraft = {};
  for (const { name, control } of fields) {
    const value = values[name];
    if (control === 'checkboxes' || control === 'files') draft[name] = (value ?? []) as string[];
    else if (control === 'file') draft[name] = value ? [value as AttachedFile] : [];
    else if (control === 'lines' || control === 'links')
      draft[name] = ((value ?? []) as string[]).join('\n');
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
    else if (control === 'links') values[name] = linesFromInput(typed).map(linkFromInput);
    else if (control === 'year') values[name] = typed.trim() === '' ? null : Number(typed);
    else values[name] = nullableTextFromInput(typed);
  }
  return values;
}

/** The message of a field or, for a list, of its first entry that failed (`links.2`). */
export function fieldMessage(messageByPath: Record<string, string>, name: string) {
  if (messageByPath[name]) return messageByPath[name];
  const entry = Object.keys(messageByPath).find((path) => path.startsWith(`${name}.`));
  return entry ? messageByPath[entry] : undefined;
}
