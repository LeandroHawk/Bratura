import { DEFAULT_LOCALE } from '@bratura/shared/primitives/external/locale/enum';
import { LIGHT_THEME_COLORS as C } from '@bratura/ui';
import type { MetadataRoute } from 'next';
import { SITE_DESCRIPTION, SITE_TITLE } from '@/features/common/config/site';

/** One manifest for the whole site, in the default locale. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_TITLE[DEFAULT_LOCALE],
    short_name: 'Bratura',
    description: SITE_DESCRIPTION[DEFAULT_LOCALE],
    lang: DEFAULT_LOCALE,
    start_url: '/',
    display: 'browser',
    background_color: C.background,
    theme_color: C.background,
    icons: [
      { src: '/icon', type: 'image/png', sizes: '64x64' },
      { src: '/apple-icon', type: 'image/png', sizes: '180x180' },
    ],
  };
}
