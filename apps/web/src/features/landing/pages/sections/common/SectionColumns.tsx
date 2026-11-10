import { Container } from '@bratura/ui';
import type { ReactNode } from 'react';
import { titleIdFromSectionId } from './titleIdFromSectionId';

/** A section on the page background, in two columns from `lg` up: heading side, then the rest. */
export function SectionColumns({ id, children }: { id: string; children: ReactNode }) {
  return (
    <Container
      as="section"
      id={id}
      aria-labelledby={titleIdFromSectionId(id)}
      className="grid gap-10 py-20 lg:grid-cols-[1fr_1fr]"
    >
      {children}
    </Container>
  );
}
