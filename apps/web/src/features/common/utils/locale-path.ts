import {
  DEFAULT_LOCALE,
  LocaleEnum,
  type Locale,
} from '@bratura/shared/primitives/external/locale/enum';

/** A path of the site as written for the default locale, e.g. `/` or `/design`. */
export type SitePath = `/${string}`;

/** The default locale is served without a prefix (`/`); every other one under `/<locale>`. */
export function localizedPathFromLocale(locale: Locale, path: SitePath): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === '/' ? `/${locale}` : `/${locale}${path}`;
}

/** `hreflang` alternates of one page, for `metadata.alternates.languages` and the sitemap. */
export function languageAlternatesFromPath(path: SitePath): Record<Locale | 'x-default', string> {
  const byLocale = Object.fromEntries(
    LocaleEnum.options.map((locale) => [locale, localizedPathFromLocale(locale, path)]),
  ) as Record<Locale, string>;
  return { ...byLocale, 'x-default': localizedPathFromLocale(DEFAULT_LOCALE, path) };
}

/** The inverse of `localizedPathFromLocale`: `/en/x` and `/x` both give `/x`. */
export function sitePathFromPathname(pathname: string): SitePath {
  const [, first = '', ...rest] = pathname.split('/');
  if (!LocaleEnum.safeParse(first).success)
    return pathname.startsWith('/') ? (pathname as SitePath) : '/';
  return `/${rest.join('/')}`;
}
