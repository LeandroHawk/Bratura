import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Container, Logo } from '@bratura/ui';
import Link from 'next/link';
import { REPO_URL, TEAM } from '@/features/common/config/site';
import { NewTabHint } from '../NewTabHint';
import { LAYOUT_CONTENT } from './content';

const FOOTER_LINK = 'focus-ring font-semibold text-foreground underline underline-offset-4';

export function SiteFooter({ locale }: { locale: Locale }) {
  const content = LAYOUT_CONTENT[locale];
  return (
    <footer className="border-t border-border">
      <Container className="flex flex-wrap items-center justify-between gap-6 py-10 text-sm text-muted-foreground">
        <Logo slogan={false} className="text-3xl" />
        <p>
          {content.madeFor}
          <br />
          {TEAM.join(' · ')}
        </p>
        <nav aria-label={content.aboutNav} className="flex flex-wrap gap-x-5 gap-y-2">
          <Link
            href="/design"
            // The design system reference is written in Portuguese only.
            hrefLang="pt-BR"
            className={FOOTER_LINK}
          >
            Design system
          </Link>
          <a href={REPO_URL} className={FOOTER_LINK} target="_blank" rel="noreferrer">
            {content.repoLink}
            <NewTabHint locale={locale} />
          </a>
        </nav>
      </Container>
    </footer>
  );
}
