'use client';

import type { ParsedWithMessages } from '@bratura/shared/messages/messages';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Button, Dialog } from '@bratura/ui';
import { useState, useSyncExternalStore } from 'react';
import { attachmentDialog } from '@/features/common/data/demoStore';
import { useContractForm } from '@/features/common/hooks/useContractForm';
import { PORTFOLIO_COMMON_CONTENT } from './content';
import { FormFields } from './FormFields';
import { draftFromValues, parseRecordDraft, type FormField } from './form-fields';

/**
 * A record of the portfolio edited in a dialog. Mount it when the dialog opens (and give it a
 * `key`), so each opening starts from the record's stored values. Files attached here and not
 * saved are forgotten when it closes, so their bytes are not left behind.
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
  const [uploads] = useState(attachmentDialog);
  const pendingUploads = useSyncExternalStore(
    uploads.subscribe,
    uploads.pendingUploadCount,
    () => 0,
  );
  const closeWithoutSaving = () => {
    uploads.close(initialValues);
    onClose();
  };
  const { draft, setField, setDraft, messageByPath, setMessageByPath, formRef, submit } =
    useContractForm({
      initialDraft: draftFromValues(fields, initialValues),
      parse: (typed) => parseRecordDraft({ fields, draft: typed, parse, locale }),
      onValid: (value) => {
        if (!uploads.canSave()) setMessageByPath({ _form: content.uploadsPending });
        else if (onSave(value) === false) setMessageByPath({ _form: content.itemLimit });
        else {
          uploads.close(value);
          onClose();
        }
      },
    });

  return (
    <Dialog open onClose={closeWithoutSaving} title={title} closeLabel={content.close}>
      <form ref={formRef} onSubmit={submit} noValidate className="grid gap-6">
        <FormFields
          locale={locale}
          fields={fields}
          labels={labels}
          draft={draft}
          setField={setField}
          messageByPath={messageByPath}
          uploads={uploads}
          pendingUploads={pendingUploads}
          setDraft={setDraft}
        />
        {messageByPath._form && <p role="alert">{messageByPath._form}</p>}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pendingUploads > 0}>
            {content.save}
          </Button>
          <Button variant="ghost" onClick={closeWithoutSaving}>
            {content.cancel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
