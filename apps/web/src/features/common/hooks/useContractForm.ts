'use client';

import type { ParsedWithMessages } from '@bratura/shared/messages/messages';
import { useRef, useState, type FormEvent } from 'react';

/**
 * A form's draft and its errors. The fields hold what the person typed (text); `parse` turns the
 * draft into the contract's shape and checks it (`parseWithMessages`), so the texts shown under
 * the fields come from the contract, in the reader's language. After a refused submit, focus goes
 * to the first field with an error.
 */
export function useContractForm<Draft extends Record<string, unknown>, Value>({
  initialDraft,
  parse,
  onValid,
}: {
  initialDraft: Draft;
  parse: (draft: Draft) => ParsedWithMessages<Value>;
  onValid: (value: Value) => void;
}) {
  const [draft, setDraft] = useState(initialDraft);
  const [messageByPath, setMessageByPath] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  function setField<Name extends keyof Draft>(name: Name, value: Draft[Name]) {
    setDraft((current) => ({ ...current, [name]: value }));
    // The message goes away as soon as the person starts fixing the field.
    setMessageByPath((current) => {
      const rest = Object.entries(current).filter(
        ([path]) => path !== name && !path.startsWith(`${String(name)}.`),
      );
      return rest.length === Object.keys(current).length ? current : Object.fromEntries(rest);
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = parse(draft);
    if (result.success) {
      setMessageByPath({});
      onValid(result.value);
      return;
    }
    setMessageByPath(result.messageByPath);
    // After React paints the errors, so the invalid mark is in the DOM.
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    });
  }

  return { draft, setField, setDraft, messageByPath, setMessageByPath, formRef, submit };
}
