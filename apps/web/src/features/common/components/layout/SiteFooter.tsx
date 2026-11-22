import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Container, Logo } from '@bratura/ui';
import { TEAM } from '@/features/common/config/site';
import { LAYOUT_CONTENT } from './content';

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
      </Container>
    </footer>
  );
}
