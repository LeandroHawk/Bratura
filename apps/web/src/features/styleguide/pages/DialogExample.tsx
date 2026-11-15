'use client';

import { Button, Dialog } from '@bratura/ui';
import { useState } from 'react';

/** A button that opens the dialog: it cannot be drawn open twice, once per theme. */
export function DialogExample() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
        Abrir o diálogo
      </Button>
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} title="Diálogo" closeLabel="Fechar">
        <p>
          Um <code>&lt;dialog&gt;</code> nativo: prende o foco, fecha com Esc e devolve o foco a
          quem o abriu. Usa o tema da página.
        </p>
      </Dialog>
    </>
  );
}
