import type { HTMLAttributes } from 'react';

type ContainerProps = HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section' | 'header' | 'footer' | 'main';
};

/** Centers content at the page's reading width, with the side gutter every section shares. */
export function Container({ as: Tag = 'div', className = '', ...props }: ContainerProps) {
  return <Tag className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`} {...props} />;
}
