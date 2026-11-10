import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'ghost';
/** `sm` for a secondary control beside content (a toggle under an illustration), not a page action. */
export type ButtonSize = 'md' | 'sm';

// Hover lifts the button off the page like a paper cut-out (hard shadow); pressing glues it back.
const BASE =
  'bt-button relative inline-flex items-center justify-center gap-2 rounded-paint border-2 ' +
  'cursor-pointer font-body font-semibold focus-ring ' +
  'transition-[translate,box-shadow,background-color] duration-150 ease-out ' +
  'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-cutout ' +
  'active:translate-x-0 active:translate-y-0 active:shadow-none ' +
  'motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0';

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'border-primary bg-primary text-primary-foreground',
  ghost: 'border-foreground bg-transparent text-foreground hover:bg-foreground/5',
};

const SIZE: Record<ButtonSize, string> = {
  md: 'px-5 py-2.5 text-small',
  sm: 'px-3.5 py-1.5 text-caption',
};

function buttonClassName(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  extra = '',
): string {
  return `${BASE} ${SIZE[size]} ${VARIANT[variant]} ${extra}`.trim();
}

/** Paint drops around the button, shown on hover and keyboard focus. Decorative. */
const Splash = () => <span className="bt-splash" aria-hidden="true" />;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant,
  size,
  className,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={buttonClassName(variant, size, className)} {...props}>
      {children}
      <Splash />
    </button>
  );
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/** Same look as Button, for navigation. */
export function ButtonLink({ variant, size, className, children, ...props }: ButtonLinkProps) {
  return (
    <a className={buttonClassName(variant, size, className)} {...props}>
      {children}
      <Splash />
    </a>
  );
}
