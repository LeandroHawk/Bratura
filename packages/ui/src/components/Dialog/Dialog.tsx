'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

type DialogProps = {
  open: boolean;
  /** Called when the person closes it: the close button, Esc, or a form with `method="dialog"`. */
  onClose: () => void;
  title: string;
  /** The title's language, when it is not the page's (a name quoted from elsewhere). */
  titleLang?: string;
  /** The close button's accessible name. */
  closeLabel: string;
  children: ReactNode;
};

/**
 * A sheet laid over the page for one task (a form, a call's details): the platform's modal
 * `<dialog>`, so focus stays inside, Esc closes it and the page behind is inert.
 */
export function Dialog({ open, onClose, title, titleLang, closeLabel, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={dialogRef} className="bt-dialog" aria-labelledby={titleId} onClose={onClose}>
      <div className="grid gap-5 p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <h2
            id={titleId}
            lang={titleLang}
            className="min-w-0 font-display text-2xl leading-tight font-bold text-balance wrap-anywhere"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="bt-dialog-close -mt-1 -mr-1 inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent text-foreground focus-ring hover:border-foreground"
          >
            <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
              <path
                d="M4 4 16 16M16 4 4 16"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
