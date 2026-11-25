import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Container, Logo, PullCord } from '@bratura/ui';
import Link from 'next/link';
import { ROUTES } from '@/features/common/config/routes';
import { localizedPathFromLocale, type SitePath } from '@/features/common/utils/locale-path';
import { LAYOUT_CONTENT } from './content';
import { LanguageSwitch } from './LanguageSwitch';

/**
 * Site-wide controls hanging from the top edge: the logo home on the left, the theme cord in the
 * corner and, past the reach of its light, the language sign.
 */
export function SiteHeader({ locale, path }: { locale: Locale; path?: SitePath }) {
  return (
    // Tall enough for the sign and the cord hanging over it, so no page has to make room for them.
    // Hidden in print: the portfolio exports to PDF through window.print().
    <Container as="header" className="relative h-44 sm:h-36 lg:h-32 print:hidden">
      {/* The landing and the 404 open with the large logo; a second one here would repeat it. */}
      {path && path !== ROUTES.home && (
        <Link
          href={localizedPathFromLocale(locale, ROUTES.home)}
          aria-label={LAYOUT_CONTENT[locale].homeLink}
          className="absolute top-6 left-4 rounded-sm focus-ring sm:left-6"
        >
          <Logo slogan={false} className="text-3xl" />
        </Link>
      )}
      <div className="absolute top-0 right-[164px] sm:right-[280px]">
        <LanguageSwitch locale={locale} path={path} />
      </div>
      <PullCord
        copy={LAYOUT_CONTENT[locale].pullCord}
        className="absolute top-0 right-4 sm:right-6"
      />
    </Container>
  );
}
