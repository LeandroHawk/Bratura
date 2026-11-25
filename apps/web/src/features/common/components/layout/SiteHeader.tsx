import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Container, PullCord } from '@bratura/ui';
import { ROUTES } from '@/features/common/config/routes';
import type { SitePath } from '@/features/common/utils/locale-path';
import { CompactHeader } from './CompactHeader';
import { LAYOUT_CONTENT } from './content';
import { LanguageSwitch } from './LanguageSwitch';

/**
 * Site-wide controls hanging from the top edge: the logo home on the left, the theme cord in the
 * corner and, past the reach of its light, the language sign.
 */
export function SiteHeader({ locale, path }: { locale: Locale; path?: SitePath }) {
  // The landing and the 404 open with the large logo, so a second one here would repeat it; the
  // other pages carry a small logo, and the full-size sign and cord dwarfed it.
  const hasSmallLogo = path !== undefined && path !== ROUTES.home;
  const size = hasSmallLogo ? 'compact' : 'default';
  const controls = (
    <>
      <div className="absolute top-0 right-[164px] sm:right-[280px]">
        <LanguageSwitch locale={locale} path={path} size={size} />
      </div>
      <PullCord
        copy={LAYOUT_CONTENT[locale].pullCord}
        size={size}
        className="absolute top-0 right-4 sm:right-6"
      />
    </>
  );
  if (hasSmallLogo) return <CompactHeader locale={locale}>{controls}</CompactHeader>;
  return (
    // Tall enough for the sign and the cord hanging over it, so no page has to make room for them.
    <Container as="header" className="relative h-44 sm:h-36 lg:h-32 print:hidden">
      {controls}
    </Container>
  );
}
