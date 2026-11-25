import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import type { ReactNode } from 'react';
import { NewTabHint } from './NewTabHint';

/** A link to another site, in running text: opens a new tab and says so to screen readers. */
export function ExternalLink({
  href,
  hrefLang,
  locale,
  className = '',
  children,
}: {
  href: string;
  hrefLang?: string;
  locale: Locale;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      hrefLang={hrefLang}
      target="_blank"
      rel="noreferrer"
      className={`text-link ${className}`}
    >
      {children}
      <NewTabHint locale={locale} />
    </a>
  );
}
