import type { Metadata } from 'next';
import { CallNoticesPage } from '@/features/call-notices/pages/CallNotices.page';
import { CALL_NOTICES_PAGE_TITLE } from '@/features/call-notices/pages/content';
import { ROUTES } from '@/features/common/config/routes';
import { pageMetadataFromLocale } from '@/features/common/config/site-metadata';
import { localeFromParams } from '@/features/common/utils/locale-from-params';

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/editais'>): Promise<Metadata> {
  const locale = await localeFromParams(params);
  return pageMetadataFromLocale(locale, {
    path: ROUTES.callNotices,
    title: CALL_NOTICES_PAGE_TITLE.overview[locale],
    isPersonal: true,
  });
}

export default async function Page({ params }: PageProps<'/[lang]/editais'>) {
  return <CallNoticesPage locale={await localeFromParams(params)} view="overview" />;
}
