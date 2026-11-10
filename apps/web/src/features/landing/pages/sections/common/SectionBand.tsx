import { Container } from '@bratura/ui';
import type { ReactNode } from 'react';
import { titleIdFromSectionId } from './titleIdFromSectionId';

/** A full-width band on the card colour, set apart from the page: the landing's key sections. */
export function SectionBand({ id, children }: { id: string; children: ReactNode }) {
  return (
    <section
      id={id}
      aria-labelledby={titleIdFromSectionId(id)}
      className="border-y border-border bg-card"
    >
      <Container className="grid gap-10 py-16">{children}</Container>
    </section>
  );
}
