import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Container } from '@bratura/ui';
import { PageShell } from '@/features/common/components/layout/PageShell';
import { ROUTES } from '@/features/common/config/routes';
import { CallNoticesScreen, type CallNoticesView } from './CallNoticesScreen';

const PATH = { matches: ROUTES.matches, overview: ROUTES.callNotices } as const;

/** Both call screens: the same page around the same parts, told which view to draw. */
export function CallNoticesPage({ locale, view }: { locale: Locale; view: CallNoticesView }) {
  return (
    <PageShell locale={locale} path={PATH[view]}>
      <Container className="pb-20">
        <CallNoticesScreen locale={locale} view={view} />
      </Container>
    </PageShell>
  );
}
