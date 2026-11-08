import { Heading, Logo } from '@bratura/ui';
import type { ReactNode } from 'react';

/** The opening of a page: the logo, the page's h1, a lead paragraph, then its actions. */
export function PageIntro({
  title,
  titleId,
  lead,
  children,
}: {
  title: string;
  /** For a section that names itself after this heading (`aria-labelledby`). */
  titleId?: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <div className="grid justify-items-start gap-7">
      <Logo className="text-[clamp(48px,9vw,76px)]" />
      <Heading as="h1" id={titleId} className="max-w-[18ch]">
        {title}
      </Heading>
      <p className="max-w-[54ch] text-lg text-muted-foreground">{lead}</p>
      {children}
    </div>
  );
}
