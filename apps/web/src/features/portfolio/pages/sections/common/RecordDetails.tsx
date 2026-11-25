import type { AttachedFile } from '@bratura/shared/primitives/domain/attached-file/fields';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import type { ReactNode } from 'react';
import { CREATOR_LABELS } from '@/features/common/content/creator-labels';
import { formattedPlainDate } from '@bratura/shared/primitives/code/calendar/format';
import { formattedAmountInCents } from '@/features/common/utils/format';
import type { FormField } from './form-fields';

const LINK = 'rounded-sm font-semibold underline underline-offset-4 focus-ring break-all';

function shownValue(value: unknown, { control, options }: FormField, locale: Locale): ReactNode {
  const labels = CREATOR_LABELS[locale];
  if (value === null || value === undefined || value === '') return null;
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return (
      <ul className="grid gap-1">
        {(value as (string | AttachedFile | { name: string; role: string })[]).map(
          (entry, index) => {
            const text =
              typeof entry === 'string'
                ? entry
                : 'fileName' in entry
                  ? entry.fileName
                  : `${entry.name} · ${entry.role}`;
            return (
              // A stored list read back, never reordered: its position is the stable key.
              <li key={index}>
                {control === 'links' ? (
                  <a href={text} target="_blank" rel="noreferrer" className={LINK}>
                    {text}
                  </a>
                ) : (
                  (options?.labels[text] ?? text)
                )}
              </li>
            );
          },
        )}
      </ul>
    );
  }
  if (control === 'file') return (value as AttachedFile).fileName;
  if (control === 'date') return formattedPlainDate(String(value), locale);
  if (control === 'amount') return formattedAmountInCents(Number(value), locale);
  if (control === 'yesNo') return value === true ? labels.yes : labels.no;
  if (control === 'select') return options?.labels[String(value)] ?? String(value);
  return String(value);
}

/** A stored record read back, field by field; what was left empty reads "não informado". */
export function RecordDetails({
  locale,
  fields,
  labels,
  values,
}: {
  locale: Locale;
  fields: FormField[];
  labels: Record<string, string>;
  values: Record<string, unknown>;
}) {
  const { notInformed } = CREATOR_LABELS[locale];
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.name} className={field.isWide ? 'sm:col-span-2' : ''}>
          <dt className="text-caption font-semibold text-muted-foreground">
            {labels[field.name] ?? field.name}
          </dt>
          <dd className="whitespace-pre-line">
            {shownValue(values[field.name], field, locale) ?? (
              <span className="text-muted-foreground">{notInformed}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
