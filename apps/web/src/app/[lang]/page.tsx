import { LandingPage } from '@/features/landing/pages/Landing.page';
import { localeFromParams } from '@/features/common/utils/locale-from-params';

// Static, rebuilt every 5 minutes: `CALL_HIGHLIGHTS_REVALIDATE_SECONDS` (Next reads a literal).
export const revalidate = 300;

export default async function Page({ params }: PageProps<'/[lang]'>) {
  return <LandingPage locale={await localeFromParams(params)} />;
}
