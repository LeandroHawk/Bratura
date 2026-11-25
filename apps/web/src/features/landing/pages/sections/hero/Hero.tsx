import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { ButtonLink, Container } from '@bratura/ui';
import { PageIntro } from '@/features/common/components/PageIntro';
import { ROUTES } from '@/features/common/config/routes';
import { TAGLINE } from '@/features/common/config/site';
import { localizedPathFromLocale } from '@/features/common/utils/locale-path';
import { HERO_CONTENT } from './content';
import { SECTION_IDS } from '@/features/landing/pages/sections/common/sectionIds';
import { titleIdFromSectionId } from '@/features/landing/pages/sections/common/titleIdFromSectionId';
import { ExampleCall } from './ExampleCall';

export function Hero({ locale }: { locale: Locale }) {
  const content = HERO_CONTENT[locale];
  return (
    <Container
      as="section"
      id={SECTION_IDS.hero}
      aria-labelledby={titleIdFromSectionId(SECTION_IDS.hero)}
      className="grid gap-12 pb-20 lg:grid-cols-[1.15fr_1fr] lg:items-start lg:justify-items-start lg:gap-y-7"
    >
      <PageIntro
        locale={locale}
        title={TAGLINE[locale]}
        titleId={titleIdFromSectionId(SECTION_IDS.hero)}
        lead={content.lead}
        // From `lg` its four pieces are rows of the hero, so the example starts level with the
        // title: `row-span-3` counts them, and `gap-y-7` repeats PageIntro's own `gap-7`.
        className="lg:contents lg:*:col-start-1"
      >
        <ul className="flex flex-wrap gap-3">
          <li>
            <ButtonLink href={localizedPathFromLocale(locale, ROUTES.signUp)}>
              {content.createPortfolio}
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href={localizedPathFromLocale(locale, ROUTES.signIn)} variant="ghost">
              {content.signIn}
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href={`#${SECTION_IDS.howItWorks}`} variant="ghost">
              {content.howItWorks}
            </ButtonLink>
          </li>
        </ul>
      </PageIntro>
      <div className="min-w-0 lg:col-start-2 lg:row-span-3 lg:row-start-2 lg:justify-self-stretch">
        <ExampleCall locale={locale} />
      </div>
    </Container>
  );
}
