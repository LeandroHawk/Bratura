import { LandingPage } from '@/features/landing/pages/Landing.page';
import { localeFromParams } from '@/features/common/utils/locale-from-params';

// Static, rebuilt every 5 minutes. Next reads only a literal here: `CallHighlights.test.tsx` keeps
// it equal to `CALL_HIGHLIGHTS_REVALIDATE_SECONDS`.
export const revalidate = 300;

export default async function Page({ params }: PageProps<'/[lang]'>) {
  return <LandingPage locale={await localeFromParams(params)} />;
}
