'use client';

import { useEffect, useId, useRef, type ReactNode, type Ref, type RefObject } from 'react';

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
 * Drives a `<dialog>` as the platform's modal from `open`, and focuses `initialFocus` once it
 * opens. React writes `autoFocus` into server HTML only: after a client navigation the browser
 * would focus the dialog's first focusable element instead.
 */
export function useModalDialog(open: boolean, initialFocus?: RefObject<HTMLElement | null>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      initialFocus?.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, initialFocus]);
  return dialogRef;
}

/** A modal's round "×", named by `label`; it turns a quarter on hover. */
export function DialogCloseButton({
  label,
  onClick,
  className = '',
  ref,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`bt-dialog-close inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent bg-background text-foreground focus-ring hover:border-foreground ${className}`}
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
  );
}

/**
 * A sheet laid over the page for one task (a form, a call's details): the platform's modal
 * `<dialog>`, so focus stays inside, Esc closes it and the page behind is inert.
 */
export function Dialog({ open, onClose, title, titleLang, closeLabel, children }: DialogProps) {
  const dialogRef = useModalDialog(open);
  const titleId = useId();

  return (
    <dialog
      ref={dialogRef}
      className="bt-modal bt-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
    >
      {/* Zero-height and sticky: the close button stays in the corner while a long sheet scrolls,
          without taking a row of its own; the title keeps clear of it with its right padding. */}
      <div className="sticky top-0 z-10 flex h-0 justify-end">
        <DialogCloseButton
          label={closeLabel}
          onClick={onClose}
          className="mt-3.5 mr-3.5 sm:mt-5.5 sm:mr-5.5"
        />
      </div>
      <div className="grid gap-5 p-5 sm:p-7">
        <h2
          id={titleId}
          lang={titleLang}
          className="min-w-0 pr-12 font-display text-2xl leading-tight font-bold text-balance wrap-anywhere"
        >
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
