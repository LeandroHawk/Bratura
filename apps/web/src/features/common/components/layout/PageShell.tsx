import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import type { ReactNode } from 'react';
import type { SitePath } from '../../utils/locale-path';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

/** Header, main content and footer shared by the public pages. */
export function PageShell({
  locale,
  path,
  children,
}: {
  locale: Locale;
  /** This page, unprefixed; leave it out when unknown (a 404). */
  path?: SitePath;
  children: ReactNode;
}) {
  return (
    // At least one screen tall, so a short page (the 404) keeps the footer at the bottom.
    <div className="flex min-h-dvh flex-col">
      {/* Full-width clip: the cord's glow fades off the right edge of the screen, not the column. */}
      <div className="flex-1 overflow-x-clip">
        <SiteHeader locale={locale} path={path} />
        <main>{children}</main>
      </div>
      <SiteFooter locale={locale} />
    </div>
  );
}
