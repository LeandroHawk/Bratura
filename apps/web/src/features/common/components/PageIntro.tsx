import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Heading, Logo } from '@bratura/ui';
import type { ReactNode } from 'react';
import { SITE_SLOGAN } from '../config/site';

/** The opening of a page: the logo, the page's h1, a lead paragraph, then its actions. */
export function PageIntro({
  locale,
  title,
  titleId,
  lead,
  children,
}: {
  locale: Locale;
  title: string;
  /** For a section that names itself after this heading (`aria-labelledby`). */
  titleId?: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <div className="grid justify-items-start gap-7">
      <Logo
        slogan={{ text: SITE_SLOGAN[locale], lang: locale }}
        className="text-[clamp(48px,9vw,76px)]"
      />
      <Heading as="h1" id={titleId} className="max-w-[18ch]">
        {title}
      </Heading>
      <p className="max-w-[54ch] text-lg text-muted-foreground">{lead}</p>
      {children}
    </div>
  );
}
