import type { MetadataRoute } from 'next';
import { ROUTES } from '@/features/common/config/routes';
import { SITE_URL } from '@/features/common/config/site';
import {
  languageAlternatesFromPath,
  localizedPathFromLocale,
} from '@/features/common/utils/locale-path';
import { LocaleEnum } from '@bratura/shared/primitives/external/locale/enum';

/** The pages open to a visitor; the signed-in area is personal and marked noindex. */
const PUBLIC_PATHS = [ROUTES.home, ROUTES.signUp, ROUTES.signIn] as const;

// /design is left out on purpose: it is a reference for the team, marked noindex.
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
