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
