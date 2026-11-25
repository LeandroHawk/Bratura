import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import type { ReactNode } from 'react';
import type { SitePath } from '@/features/common/utils/locale-path';
import { hasMuseumMapNav } from './hasMuseumMapNav';
import { SiteFooter } from './SiteFooter';
import { MAIN_CONTENT_ID } from './mainContentId';
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
    // Below `md` the folded map is fixed at the bottom: room under the footer keeps it uncovered.
    <div
      className={`flex min-h-dvh flex-col ${hasMuseumMapNav(path) ? 'max-md:museum-map-clearance' : ''}`}
    >
      {/* Full-width clip: the cord's glow fades off the screen's right edge, not the column's. */}
      <div className="flex-1 overflow-x-clip">
        <SiteHeader locale={locale} path={path} />
        <main id={MAIN_CONTENT_ID}>{children}</main>
      </div>
      <SiteFooter locale={locale} />
    </div>
  );
}
