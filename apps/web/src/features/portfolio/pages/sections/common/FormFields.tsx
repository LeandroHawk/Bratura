'use client';

import type { AttachedFile } from '@bratura/shared/primitives/domain/attached-file/fields';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Button, Checkbox, Fieldset, SelectField, TextAreaField, TextField } from '@bratura/ui';
import { CREATOR_LABELS } from '@/features/common/content/creator-labels';
import { PORTFOLIO_COMMON_CONTENT } from './content';
import { fieldMessage, type FormDraft, type FormField } from './formFields';

const FILE_INPUT =
  'block w-full cursor-pointer rounded-xl text-small text-muted-foreground focus-ring ' +
  'file:mr-3 file:cursor-pointer file:rounded-full file:border-2 file:border-solid ' +
  'file:border-foreground file:bg-transparent file:px-3.5 file:py-1.5 file:font-body ' +
  'file:text-caption file:font-semibold file:text-foreground';

type CommonContent = (typeof PORTFOLIO_COMMON_CONTENT)[Locale];

const LIST_HINT = {
  lines: (content: CommonContent) => content.onePerLine,
  links: (content: CommonContent) => content.oneLinkPerLine,
  people: (content: CommonContent) => content.onePersonPerLine,
};

/** The controls of a form, drawn from its field list: one renderer for every portfolio form. */
export function FormFields({
  locale,
  fields,
  labels,
  draft,
  setField,
  messageByPath,
}: {
  locale: Locale;
  fields: FormField[];
  /** The label of each field, by its name. */
  labels: Record<string, string>;
  draft: FormDraft;
  setField: (name: string, value: FormDraft[string]) => void;
  messageByPath: Record<string, string>;
}) {
  const content = PORTFOLIO_COMMON_CONTENT[locale];
  const { optional, chooseOne, yes, no } = CREATOR_LABELS[locale];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map(({ name, control, isRequired, isWide, options }) => {
        const typed = draft[name];
        const wide = isWide ? 'sm:col-span-2' : '';
        const texts = {
          label: labels[name] ?? name,
          optionalMark: isRequired ? undefined : optional,
          error: fieldMessage(messageByPath, name),
        };

        if (typeof typed === 'string') {
          const common = {
            ...texts,
            name,
            className: wide,
            value: typed,
            onChange: (event: { target: { value: string } }) => setField(name, event.target.value),
          };
          if (control === 'textarea') return <TextAreaField key={name} {...common} />;
          if (control === 'lines' || control === 'links' || control === 'people')
            return (
              <TextAreaField
                key={name}
                {...common}
                rows={3}
                hint={LIST_HINT[control](content)}
                inputMode={control === 'links' ? 'url' : undefined}
              />
            );
          if (control === 'yesNo')
            return (
              <SelectField key={name} {...common}>
                <option value="">{chooseOne}</option>
                <option value="yes">{yes}</option>
                <option value="no">{no}</option>
              </SelectField>
            );
          if (control === 'amount')
            return (
              <TextField key={name} {...common} inputMode="decimal" hint={content.amountInReais} />
            );
          if (control === 'select')
            return (
              <SelectField key={name} {...common}>
                <option value="">{chooseOne}</option>
                {options?.values.map((value) => (
                  <option key={value} value={value}>
                    {options.labels[value]}
                  </option>
                ))}
              </SelectField>
            );
          if (control === 'date') return <TextField key={name} {...common} type="date" />;
          if (control === 'year')
            return <TextField key={name} {...common} inputMode="numeric" maxLength={4} />;
          return <TextField key={name} {...common} />;
        }

        if (control === 'checkboxes') {
          const chosen = typed as string[];
          return (
            <Fieldset key={name} legend={texts.label} error={texts.error} className={wide}>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {options?.values.map((value) => (
                  <Checkbox
                    key={value}
                    name={name}
                    value={value}
                    checked={chosen.includes(value)}
                    onChange={(event) =>
                      setField(
                        name,
                        event.target.checked
                          ? [...chosen, value]
                          : chosen.filter((other) => other !== value),
                      )
                    }
                  >
                    {options.labels[value]}
                  </Checkbox>
                ))}
              </div>
            </Fieldset>
          );
        }

        const files = typed as AttachedFile[];
        const takesSeveral = control === 'files';
        return (
          <Fieldset
            key={name}
            legend={`${texts.label}${texts.optionalMark ? ` ${texts.optionalMark}` : ''}`}
            hint={content.filesNotice}
            error={texts.error}
            className={wide}
          >
            {files.length > 0 && (
              <ul className="grid gap-1.5">
                {files.map((file) => (
                  <li
                    key={file.fileName}
                    className="rise-in flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-1.5 text-small"
                  >
                    <span className="min-w-0 truncate">{file.fileName}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={content.removeFile(file.fileName)}
                      onClick={() =>
                        setField(
                          name,
                          files.filter((other) => other !== file),
                        )
                      }
                    >
                      ×
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <input
              type="file"
              multiple={takesSeveral}
              aria-label={`${texts.label}: ${takesSeveral ? content.chooseFiles : content.chooseFile}`}
              className={FILE_INPUT}
              onChange={(event) => {
                const chosen = [...(event.target.files ?? [])].map((file) => ({
                  fileName: file.name,
                  mediaType: file.type,
                  sizeInBytes: file.size,
                }));
                setField(name, takesSeveral ? [...files, ...chosen] : chosen);
                // The same file can be picked again after being removed.
                event.target.value = '';
              }}
            />
          </Fieldset>
        );
      })}
    </div>
  );
}
