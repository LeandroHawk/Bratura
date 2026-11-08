import { LandingPage } from '@/features/landing/pages/Landing.page';
import { localeFromParams } from '@/features/common/utils/locale-from-params';

export default async function Page({ params }: PageProps<'/[lang]'>) {
  return <LandingPage locale={await localeFromParams(params)} />;
}
