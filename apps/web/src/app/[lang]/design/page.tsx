import type { Metadata } from 'next';
import { ROUTES } from '@/features/common/config/routes';
import { pageMetadataFromLocale } from '@/features/common/config/site-metadata';
import { localeFromParams } from '@/features/common/utils/locale-from-params';
import { STYLEGUIDE_CONTENT } from '@/features/styleguide/pages/content';
import { StyleguidePage } from '@/features/styleguide/pages/Styleguide.page';

export async function generateMetadata({ params }: PageProps<'/[lang]/design'>): Promise<Metadata> {
  const locale = await localeFromParams(params);
  const content = STYLEGUIDE_CONTENT[locale];
  return {
    ...pageMetadataFromLocale(locale, {
      path: ROUTES.designSystem,
      title: content.title,
      isHiddenFromSearch: true,
    }),
    description: content.description,
  };
}

export default async function Page({ params }: PageProps<'/[lang]/design'>) {
  return <StyleguidePage locale={await localeFromParams(params)} />;
}
