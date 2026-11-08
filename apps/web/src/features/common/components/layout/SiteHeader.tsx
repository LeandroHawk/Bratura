import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Container, PullCord } from '@bratura/ui';
import type { SitePath } from '../../utils/locale-path';
import { LAYOUT_CONTENT } from './content';
import { LanguageSwitch } from './LanguageSwitch';

/**
 * Site-wide controls hanging from the top edge: the theme cord in the corner and, past the reach of
 * its light, the language sign.
 */
export function SiteHeader({ locale, path }: { locale: Locale; path?: SitePath }) {
  return (
    // Tall enough for the sign and the cord hanging over it, so no page has to make room for them.
    <Container as="header" className="relative h-44 sm:h-36 lg:h-24">
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
