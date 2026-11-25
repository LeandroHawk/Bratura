import type { MetadataRoute } from 'next';
import { PUBLIC_PATHS, ROUTES } from '@/features/common/config/routes';
import { SITE_URL } from '@/features/common/config/site';
import {
  languageAlternatesFromPath,
  localizedPathFromLocale,
} from '@/features/common/utils/locale-path';
import { LocaleEnum } from '@bratura/shared/primitives/external/locale/enum';

// Only the public pages: the signed-in area and /design are marked noindex.
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.flatMap((path) => {
    const languages = Object.fromEntries(
      Object.entries(languageAlternatesFromPath(path)).map(([locale, localizedPath]) => [
        locale,
        `${SITE_URL}${localizedPath}`,
      ]),
    );
    return LocaleEnum.options.map((locale) => ({
      url: `${SITE_URL}${localizedPathFromLocale(locale, path)}`,
      changeFrequency: 'weekly' as const,
      priority: path === ROUTES.home ? 1 : 0.5,
      alternates: { languages },
    }));
  });
}
