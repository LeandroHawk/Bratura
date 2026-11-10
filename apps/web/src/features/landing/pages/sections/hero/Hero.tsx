import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { ButtonLink, Container } from '@bratura/ui';
import { PageIntro } from '@/features/common/components/PageIntro';
import { NewTabHint } from '@/features/common/components/NewTabHint';
import { REPO_URL, TAGLINE } from '@/features/common/config/site';
import { HERO_CONTENT } from './content';
import { SECTION_IDS } from '../common/sectionIds';
import { titleIdFromSectionId } from '../common/titleIdFromSectionId';
import { ExampleCall } from './ExampleCall';

export function Hero({ locale }: { locale: Locale }) {
  const content = HERO_CONTENT[locale];
  return (
    <Container
      as="section"
      id={SECTION_IDS.hero}
      aria-labelledby={titleIdFromSectionId(SECTION_IDS.hero)}
      className="grid items-center gap-12 pb-20 lg:grid-cols-[1.15fr_1fr]"
    >
      <PageIntro
        locale={locale}
        title={TAGLINE[locale]}
        titleId={titleIdFromSectionId(SECTION_IDS.hero)}
        lead={content.lead}
      >
        <ul className="flex flex-wrap gap-3">
          <li>
            <ButtonLink href={`#${SECTION_IDS.howItWorks}`}>{content.howItWorks}</ButtonLink>
          </li>
          <li>
            <ButtonLink href={REPO_URL} variant="ghost" target="_blank" rel="noreferrer">
              {content.seeCode}
              <NewTabHint locale={locale} />
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href="/design" hrefLang="pt-BR" lang="en" variant="ghost">
              Design system
            </ButtonLink>
          </li>
        </ul>
      </PageIntro>
      <ExampleCall locale={locale} />
    </Container>
  );
}
