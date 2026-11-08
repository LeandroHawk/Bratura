import { Heading } from '@bratura/ui';
import type { ReactNode } from 'react';

/** A museum wall label: the work's title, its medium in italics, then the description. */
export function WallLabel({
  title,
  medium,
  children,
}: {
  title: string;
  medium: string;
  children: ReactNode;
}) {
  return (
    <>
      <Heading as="h3">{title}</Heading>
      <p className="font-display text-small text-muted-foreground italic">{medium}</p>
      {children}
    </>
  );
}
