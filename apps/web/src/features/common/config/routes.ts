import type { SitePath } from '@/features/common/utils/locale-path';

/** The app's pages, unprefixed (`localizedPathFromLocale` adds the locale). */
export const ROUTES = {
  home: '/',
  signUp: '/cadastro',
  signIn: '/entrar',
  portfolio: '/portfolio',
  matches: '/compatibilidade',
  callNotices: '/editais',
} as const satisfies Record<string, SitePath>;

/** The pages open to a visitor: the sitemap lists them, the phone map's ground floor shows them. */
export const PUBLIC_PATHS = [ROUTES.home, ROUTES.signUp, ROUTES.signIn] as const;
