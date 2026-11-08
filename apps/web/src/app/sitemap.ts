import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/features/common/config/site';
import {
  languageAlternatesFromPath,
  localizedPathFromLocale,
} from '@/features/common/utils/locale-path';
import { LocaleEnum } from '@bratura/shared/primitives/external/locale/enum';

// /design is left out on purpose: it is a reference for the team, marked noindex.
export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    Object.entries(languageAlternatesFromPath('/')).map(([locale, path]) => [
      locale,
      `${SITE_URL}${path}`,
    ]),
  );
  return LocaleEnum.options.map((locale) => ({
    url: `${SITE_URL}${localizedPathFromLocale(locale, '/')}`,
    changeFrequency: 'weekly',
    priority: 1,
    alternates: { languages },
  }));
}
