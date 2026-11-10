import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { ButtonLink, Container } from '@bratura/ui';
import { PageIntro } from '@/features/common/components/PageIntro';
import { NewTabHint } from '@/features/common/components/NewTabHint';
import { REPO_URL, TAGLINE } from '@/features/common/config/site';
import { HERO_CONTENT } from './content';
import { ExampleCall } from './ExampleCall';

export function Hero({ locale }: { locale: Locale }) {
  const content = HERO_CONTENT[locale];
  return (
    <Container
      as="section"
      aria-labelledby="hero-title"
      className="grid items-center gap-12 pb-20 lg:grid-cols-[1.15fr_1fr]"
    >
      <PageIntro locale={locale} title={TAGLINE[locale]} titleId="hero-title" lead={content.lead}>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="#como-funciona">{content.howItWorks}</ButtonLink>
          <ButtonLink href={REPO_URL} variant="ghost" target="_blank" rel="noreferrer">
            {content.seeCode}
            <NewTabHint locale={locale} />
          </ButtonLink>
          <ButtonLink href="/design" hrefLang="pt-BR" variant="ghost">
            Design system
          </ButtonLink>
        </div>
      </PageIntro>
      <ExampleCall locale={locale} />
    </Container>
  );
}
