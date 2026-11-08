import { LocaleEnum } from '@bratura/shared/primitives/external/locale/enum';
import { LIGHT_THEME_COLORS } from '@bratura/ui';
import type { Metadata, Viewport } from 'next';
import { SiteDocument } from '@/features/common/components/layout/SiteDocument';
import { siteMetadataFromLocale } from '@/features/common/config/site-metadata';
import { localeFromParams } from '@/features/common/utils/locale-from-params';

/** Every locale is prerendered; any other first segment is a 404. */
export const dynamicParams = false;
export function generateStaticParams() {
  return LocaleEnum.options.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<'/[lang]'>): Promise<Metadata> {
  return siteMetadataFromLocale(await localeFromParams(params));
}

// Light theme background; switched to the dark one by the theme script and the pull cord.
export const viewport: Viewport = { themeColor: LIGHT_THEME_COLORS.background };

export default async function RootLayout({ children, params }: LayoutProps<'/[lang]'>) {
  return <SiteDocument locale={await localeFromParams(params)}>{children}</SiteDocument>;
}
