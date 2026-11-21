import type { InputHTMLAttributes, ReactNode } from 'react';

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** The visible label; clicking it toggles the box. */
  children: ReactNode;
};

/** A yes or no the person ticks; the mark is drawn by hand when it is checked. */
export function Checkbox({ children, className = '', ...props }: CheckboxProps) {
  return (
    <label
      className={`bt-checkbox inline-flex cursor-pointer items-start gap-2.5 font-body text-small ${className}`}
    >
      <span className="relative mt-0.5 inline-flex size-5 shrink-0">
        <input
          type="checkbox"
          className="bt-checkbox-input size-5 cursor-pointer appearance-none rounded-md border-2 border-muted-foreground bg-card focus-ring"
          {...props}
        />
        <svg
          className="bt-checkbox-mark pointer-events-none absolute inset-0 size-5 text-primary-foreground"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4.5 10.5 8.5 14.5 15.5 5.5"
            pathLength="1"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>{children}</span>
    </label>
  );
}
