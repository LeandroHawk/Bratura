import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Container } from '@bratura/ui';
import { PageShell } from '@/features/common/components/layout/PageShell';
import { ROUTES } from '@/features/common/config/routes';
import { PortfolioScreen } from './PortfolioScreen';

export function PortfolioPage({ locale }: { locale: Locale }) {
  return (
    <PageShell locale={locale} path={ROUTES.portfolio}>
      <Container className="pb-20">
        <PortfolioScreen locale={locale} />
      </Container>
    </PageShell>
  );
}
