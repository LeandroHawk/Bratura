'use client';

import type { ParsedWithMessages } from '@bratura/shared/messages/messages';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Button, Dialog } from '@bratura/ui';
import { useContractForm } from '@/features/common/hooks/useContractForm';
import { PORTFOLIO_COMMON_CONTENT } from './content';
import { FormFields } from './FormFields';
import { draftFromValues, parseRecordDraft, type FormField } from './form-fields';

/**
 * A record of the portfolio edited in a dialog. Mount it when the dialog opens (and give it a
 * `key`), so each opening starts from the record's stored values.
 */
export function RecordFormDialog<Value>({
  locale,
  title,
  fields,
  labels,
  initialValues,
  parse,
  onSave,
  onClose,
}: {
  locale: Locale;
  title: string;
  fields: FormField[];
  labels: Record<string, string>;
  initialValues: Record<string, unknown>;
  /** Checks the typed values against the contract (`parseWithMessages`). */
  parse: (values: Record<string, unknown>) => ParsedWithMessages<Value>;
  onSave: (value: Value) => void | boolean;
  onClose: () => void;
}) {
  const content = PORTFOLIO_COMMON_CONTENT[locale];
  const { draft, setField, messageByPath, setMessageByPath, formRef, submit } = useContractForm({
    initialDraft: draftFromValues(fields, initialValues),
    parse: (typed) => parseRecordDraft({ fields, draft: typed, parse, locale }),
    onValid: (value) => {
      if (onSave(value) === false) setMessageByPath({ _form: content.itemLimit });
      else onClose();
    },
  });

  return (
    <Dialog open onClose={onClose} title={title} closeLabel={content.close}>
      <form ref={formRef} onSubmit={submit} noValidate className="grid gap-6">
        <FormFields
          locale={locale}
          fields={fields}
          labels={labels}
          draft={draft}
          setField={setField}
          messageByPath={messageByPath}
        />
        {messageByPath._form && <p role="alert">{messageByPath._form}</p>}
        <div className="flex flex-wrap gap-3">
          <Button type="submit">{content.save}</Button>
          <Button variant="ghost" onClick={onClose}>
            {content.cancel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
