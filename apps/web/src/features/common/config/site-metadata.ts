import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import type { Metadata } from 'next';
import {
  languageAlternatesFromPath,
  localizedPathFromLocale,
  type SitePath,
} from '@/features/common/utils/locale-path';
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from './site';

/** Open Graph wants `language_TERRITORY`, not BCP 47. */
const OPEN_GRAPH_LOCALE: Record<Locale, string> = { 'pt-BR': 'pt_BR', en: 'en_US' };

/** Site-wide metadata of one locale; the preview image comes from `[lang]/opengraph-image.tsx`. */
export function siteMetadataFromLocale(locale: Locale): Metadata {
  const description = SITE_DESCRIPTION[locale];
  const title = SITE_TITLE[locale];
  const url = localizedPathFromLocale(locale, '/');
  return {
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: url, languages: languageAlternatesFromPath('/') },
    // A page sets only its own name (`title: 'Design system'`); the tab then reads "Design system ·
    // Bratura".
    title: { default: title, template: '%s · Bratura' },
    description,
    applicationName: 'Bratura',
    openGraph: {
      type: 'website',
      locale: OPEN_GRAPH_LOCALE[locale],
      siteName: 'Bratura',
      url,
      title,
      description,
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

/**
 * Metadata of one page under the locale layout: its name in the tab and its address in each
 * language. A page behind the sign-in (`isPersonal`) stays out of search results.
 */
export function pageMetadataFromLocale(
  locale: Locale,
  { path, title, isPersonal = false }: { path: SitePath; title: string; isPersonal?: boolean },
): Metadata {
  return {
    title,
    alternates: {
      canonical: localizedPathFromLocale(locale, path),
      languages: languageAlternatesFromPath(path),
    },
    ...(isPersonal && { robots: { index: false } }),
  };
}
