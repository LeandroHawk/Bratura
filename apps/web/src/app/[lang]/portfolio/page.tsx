import type { Metadata } from 'next';
import { ROUTES } from '@/features/common/config/routes';
import { pageMetadataFromLocale } from '@/features/common/config/site-metadata';
import { localeFromParams } from '@/features/common/utils/locale-from-params';
import { PORTFOLIO_PAGE_TITLE } from '@/features/portfolio/pages/content';
import { PortfolioPage } from '@/features/portfolio/pages/Portfolio.page';

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/portfolio'>): Promise<Metadata> {
  const locale = await localeFromParams(params);
  return pageMetadataFromLocale(locale, {
    path: ROUTES.portfolio,
    title: PORTFOLIO_PAGE_TITLE[locale],
    isHiddenFromSearch: true,
  });
}

export default async function Page({ params }: PageProps<'/[lang]/portfolio'>) {
  return <PortfolioPage locale={await localeFromParams(params)} />;
}
