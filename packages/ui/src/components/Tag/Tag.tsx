import type { ReactNode } from 'react';

export type TagSize = 'sm' | 'md';

const SIZE: Record<TagSize, string> = {
  sm: 'px-2.5 py-0.5 text-caption',
  md: 'px-3 py-1 text-small',
};

/**
 * A neutral label: an item of a list, a document asked for, a feature included. Its border is the
 * text colour faded, so it sits on any surface (a card, the stage, the ticket) without a colour of
 * its own. A label that means a status (open, closing soon, missing) is a `Badge`.
 */
export function Tag({
  as: Element = 'span',
  size = 'sm',
  className = '',
  children,
}: {
  as?: 'span' | 'li';
  size?: TagSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Element
      className={`inline-flex items-center rounded-full border border-current/25 font-body ${SIZE[size]} ${className}`}
    >
      {children}
    </Element>
  );
}
