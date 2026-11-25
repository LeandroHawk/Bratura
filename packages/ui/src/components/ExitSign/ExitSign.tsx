import type { ButtonHTMLAttributes } from 'react';

/**
 * The way out, drawn as a lit emergency exit sign: a green box, a figure running through a door
 * and the word. A real `<button>` whose visible text (`label`, then `hint`) is its name.
 */
export function ExitSign({
  label,
  hint,
  size = 'default',
  className = '',
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type'> & {
  /** The sign's word ("Saída"). */
  label: string;
  /** A smaller line under it that says what leaving does. */
  hint?: string;
  /** `compact` is a smaller sign, hung over a door at the corridor's scale. */
  size?: 'default' | 'compact';
}) {
  return (
    <button
      type="button"
      className={`bt-exit focus-ring ${size === 'compact' ? 'is-compact' : ''} ${className}`}
      {...props}
    >
      <svg className="bt-exit-figure" viewBox="0 0 32 24" aria-hidden="true">
        <path className="bt-exit-door" d="M21 2h9v20h-9Z" />
        <circle cx="11" cy="4" r="2.6" />
        <path d="M10 8 7 14l5 2-2 6M10 8l4 4 4-1M10 8 5 10l-2 3M12 16l5 1 1 5" />
      </svg>
      <span className="bt-exit-text">
        <span className="bt-exit-label">{label}</span>
        {hint && <span className="bt-exit-hint">{hint}</span>}
      </span>
    </button>
  );
}
