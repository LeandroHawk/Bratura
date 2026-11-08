import type { HTMLAttributes } from 'react';

type CardProps = HTMLAttributes<HTMLElement> & {
  /** Pick the element that says what the card is: a standalone item, an illustration, a region. */
  as?: 'div' | 'article' | 'figure' | 'section';
};

export function Card({ as: Tag = 'div', className = '', ...props }: CardProps) {
  return <Tag className={`rounded-2xl border border-border bg-card p-5 ${className}`} {...props} />;
}
