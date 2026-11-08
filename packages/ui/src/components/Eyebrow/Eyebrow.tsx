import type { HTMLAttributes } from 'react';

type EyebrowProps = HTMLAttributes<HTMLElement> & {
  as?: 'p' | 'span' | 'figcaption';
};

/** Small uppercase label that sits above or beside content: a room number, a caption, a group name. */
export function Eyebrow({ as: Tag = 'p', className = '', ...props }: EyebrowProps) {
  return (
    <Tag
      className={`font-body text-xs tracking-[0.1em] text-muted-foreground uppercase ${className}`}
      {...props}
    />
  );
}
