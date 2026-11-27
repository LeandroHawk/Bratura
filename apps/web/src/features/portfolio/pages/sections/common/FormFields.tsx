'use client';

import type { AttachedFile } from '@bratura/shared/primitives/domain/attached-file/fields';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import type { ComponentProps } from 'react';
import { Checkbox, Fieldset, SelectField, TextAreaField, TextField } from '@bratura/ui';
import { CREATOR_LABELS } from '@/features/common/content/creator-labels';
import { AttachedFilesField } from './AttachedFilesField';
import { PORTFOLIO_COMMON_CONTENT } from './content';
import { fieldMessage, type FormDraft, type FormField } from './form-fields';

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
  onUploadsChange,
}: {
  locale: Locale;
  fields: FormField[];
  /** The label of each field, by its name. */
  labels: Record<string, string>;
  draft: FormDraft;
  setField: (name: string, value: FormDraft[string]) => void;
  messageByPath: Record<string, string>;
  onUploadsChange: ComponentProps<typeof AttachedFilesField>['onUploadsChange'];
}) {
  const content = PORTFOLIO_COMMON_CONTENT[locale];
  const { optional, chooseOne, yes, no } = CREATOR_LABELS[locale];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map(({ name, control, isRequired, isWide, options, acceptsOnlyImages }) => {
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

        return (
          <AttachedFilesField
            key={name}
            locale={locale}
            name={name}
            legend={`${texts.label}${texts.optionalMark ? ` ${texts.optionalMark}` : ''}`}
            error={texts.error}
            className={wide}
            files={typed as AttachedFile[]}
            takesSeveral={control === 'files'}
            acceptsOnlyImages={acceptsOnlyImages ?? false}
            onChange={(files) => setField(name, files)}
            onUploadsChange={onUploadsChange}
          />
        );
      })}
    </div>
  );
}
