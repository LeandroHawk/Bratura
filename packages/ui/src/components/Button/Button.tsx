import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'ghost';

// Hover lifts the button off the page like a paper cut-out (hard shadow); pressing glues it back.
const BASE =
  'bt-button relative inline-flex items-center justify-center gap-2 rounded-paint border-2 px-5 py-2.5 ' +
  'font-body text-small font-semibold focus-ring ' +
  'transition-[translate,box-shadow,background-color] duration-150 ease-out ' +
  'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-cutout ' +
  'active:translate-x-0 active:translate-y-0 active:shadow-none ' +
  'motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0';

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'border-primary bg-primary text-primary-foreground',
  ghost: 'border-foreground bg-transparent text-foreground hover:bg-foreground/5',
};

export function buttonClassName(variant: ButtonVariant = 'primary', extra = ''): string {
  return `${BASE} ${VARIANT[variant]} ${extra}`.trim();
}

/** Paint drops around the button, shown on hover and keyboard focus. Decorative. */
const Splash = () => <span className="bt-splash" aria-hidden="true" />;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant };

export function Button({ variant, className, type = 'button', children, ...props }: ButtonProps) {
  return (
    <button type={type} className={buttonClassName(variant, className)} {...props}>
      {children}
      <Splash />
    </button>
  );
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: ButtonVariant };

/** Same look as Button, for navigation. */
export function ButtonLink({ variant, className, children, ...props }: ButtonLinkProps) {
  return (
    <a className={buttonClassName(variant, className)} {...props}>
      {children}
      <Splash />
    </a>
  );
}
