import type { HTMLAttributes } from 'react';

export type HeadingSize = 'display' | 'section' | 'card' | 'item';

const SIZE: Record<HeadingSize, string> = {
  display: 'text-4xl leading-[1.08] sm:text-5xl',
  section: 'text-3xl leading-tight sm:text-4xl',
  card: 'text-2xl leading-tight',
  item: 'text-xl leading-snug',
};

type HeadingTag = 'h1' | 'h2' | 'h3' | 'p';

/** Size that matches each level when none is given. */
const DEFAULT_SIZE: Record<HeadingTag, HeadingSize> = {
  h1: 'display',
  h2: 'section',
  h3: 'item',
  p: 'card',
};

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  /** The document level. Use "p" for text that looks like a title but is not a section. */
  as?: HeadingTag;
  /** The visual size, independent from the level. */
  size?: HeadingSize;
};

export function Heading({ as: Tag = 'h2', size, className = '', ...props }: HeadingProps) {
  return (
    <Tag
      className={`font-display font-bold text-balance ${SIZE[size ?? DEFAULT_SIZE[Tag]]} ${className}`}
      {...props}
    />
  );
}
