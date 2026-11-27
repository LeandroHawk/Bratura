'use client';

import type { ParsedWithMessages } from '@bratura/shared/messages/messages';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import type { AttachedFile } from '@bratura/shared/primitives/domain/attached-file/fields';
import { Button, Dialog } from '@bratura/ui';
import { useRef, useState } from 'react';
import { forgetFiles } from '@/features/common/data/demoFileStore';
import { useContractForm } from '@/features/common/hooks/useContractForm';
import { PORTFOLIO_COMMON_CONTENT } from './content';
import { FormFields } from './FormFields';
import { draftFromValues, parseRecordDraft, type FormField } from './form-fields';

/** The `storageKey` of every file a record's file fields point at. */
function storageKeysOf(fields: FormField[], values: Record<string, unknown>): Set<string> {
  return new Set(
    fields
      .filter(({ control }) => control === 'file' || control === 'files')
      .flatMap(({ name }) => [values[name]].flat() as (AttachedFile | null | undefined)[])
      .flatMap((file) => file?.storageKey ?? []),
  );
}

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
  const keptHereRef = useRef<string[]>([]);
  const isClosedRef = useRef(false);
  const [pendingUploads, setPendingUploads] = useState(0);
  const forgetUnsavedFiles = (saved: Record<string, unknown>) => {
    const savedKeys = storageKeysOf(fields, saved);
    forgetFiles(keptHereRef.current.filter((key) => !savedKeys.has(key)));
    isClosedRef.current = true;
  };
  const closeWithoutSaving = () => {
    forgetUnsavedFiles(initialValues);
    onClose();
  };
  const { draft, setField, messageByPath, setMessageByPath, formRef, submit } = useContractForm({
    initialDraft: draftFromValues(fields, initialValues),
    parse: (typed) => parseRecordDraft({ fields, draft: typed, parse, locale }),
    onValid: (value) => {
      if (pendingUploads > 0) setMessageByPath({ _form: content.uploadsPending });
      else if (onSave(value) === false) setMessageByPath({ _form: content.itemLimit });
      else {
        forgetUnsavedFiles(value as Record<string, unknown>);
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
          onUploadsChange={(event) => {
            // A file kept after the dialog closed joins no record: forget it at once.
            if ('keptStorageKey' in event && isClosedRef.current)
              forgetFiles([event.keptStorageKey]);
            else if ('keptStorageKey' in event) keptHereRef.current.push(event.keptStorageKey);
            else setPendingUploads((pending) => pending + event.pendingDelta);
          }}
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
