import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Container, PullCord } from '@bratura/ui';
import type { SitePath } from '@/features/common/utils/locale-path';
import { CompactHeader } from './CompactHeader';
import { LAYOUT_CONTENT } from './content';
import { hasMuseumMapNav } from './hasMuseumMapNav';
import { LanguageSwitch } from './LanguageSwitch';
import { LazyMuseumMapNav } from './LazyMuseumMapNav';

/**
 * Site-wide controls hanging from the top edge: the logo home on the left, the theme cord in the
 * corner and, past the reach of its light, the language sign.
 */
export function SiteHeader({ locale, path }: { locale: Locale; path?: SitePath }) {
  // Every page but the landing folds the sign and the cord into the bottom map below `md`.
  const showsMuseumMapNav = hasMuseumMapNav(path);
  // The landing and the 404 open with the large logo, so a second one here would repeat it; the
  // other pages carry a small logo, and the full-size sign and cord dwarfed it.
  const hasSmallLogo = path !== undefined && showsMuseumMapNav;
  const size = hasSmallLogo ? 'compact' : 'default';
  const onlyFromMd = showsMuseumMapNav ? 'max-md:hidden' : '';
  const controls = (
    <>
      <div className={`absolute top-0 right-[164px] sm:right-[280px] ${onlyFromMd}`}>
        <LanguageSwitch locale={locale} path={path} size={size} />
      </div>
      <PullCord
        copy={LAYOUT_CONTENT[locale].pullCord}
        size={size}
        className={`absolute top-0 right-4 sm:right-6 ${onlyFromMd}`}
      />
      {showsMuseumMapNav && <LazyMuseumMapNav locale={locale} path={path} />}
    </>
  );
  if (hasSmallLogo) return <CompactHeader locale={locale}>{controls}</CompactHeader>;
  return (
    // Tall enough for the sign and the cord hanging over it, so no page has to make room for them.
    // The 404 folds them into the map on a phone, so there it is only a strip.
    <Container
      as="header"
      className={`relative print:hidden ${showsMuseumMapNav ? 'h-6 md:h-32' : 'h-44 sm:h-36 lg:h-32'}`}
    >
      {controls}
    </Container>
  );
}
