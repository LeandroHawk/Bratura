import { Eyebrow } from '@bratura/ui';
import type { ReactNode } from 'react';

/** One block of a theme's panel: its label over the examples. */
export function StyleguideBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid gap-3">
      <Eyebrow as="span">{title}</Eyebrow>
      {children}
    </div>
  );
}
