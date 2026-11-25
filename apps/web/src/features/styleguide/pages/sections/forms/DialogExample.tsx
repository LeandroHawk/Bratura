'use client';

import { Button, Dialog } from '@bratura/ui';
import { useState } from 'react';
import type { FORMS_CONTENT } from './content';

/** A button that opens the dialog: it cannot be drawn open twice, once per theme. */
export function DialogExample({ copy }: { copy: (typeof FORMS_CONTENT)['pt-BR']['dialog'] }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
        {copy.open}
      </Button>
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={copy.title}
        closeLabel={copy.close}
      >
        <p>
          {copy.body.before} <code>&lt;dialog&gt;</code>
          {copy.body.after}
        </p>
      </Dialog>
    </>
  );
}
