import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { ROUTES } from '@/features/common/config/routes';
import type { SitePath } from '@/features/common/utils/locale-path';
import { APP_CONTENT } from './content';

/** The signed-in area's rooms, in order: the corridor's doors and the phone's map number them. */
export const APP_PAGES = [
  { path: ROUTES.portfolio, label: 'portfolio' },
  { path: ROUTES.matches, label: 'matches' },
  { path: ROUTES.callNotices, label: 'callNotices' },
] as const satisfies readonly { path: SitePath; label: keyof (typeof APP_CONTENT)['pt-BR'] }[];

/** A page of `APP_PAGES` as a room: its name, its number by its place, its plaque's caption. */
export function appRoomFromPage(
  locale: Locale,
  page: (typeof APP_PAGES)[number],
  index: number,
): { path: SitePath; name: string; number: string; caption: string } {
  const content = APP_CONTENT[locale];
  const number = String(index + 1);
  return {
    path: page.path,
    name: content[page.label],
    number,
    caption: `${content.room} ${number}`,
  };
}
