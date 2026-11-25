import { ROUTES } from '@/features/common/config/routes';
import type { SitePath } from '@/features/common/utils/locale-path';

/** Below `md`, every page but the landing folds its controls into the bottom `MuseumMapNav`. */
export function hasMuseumMapNav(path: SitePath | undefined): boolean {
  return path !== ROUTES.home;
}
