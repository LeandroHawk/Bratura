import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Corridor, CorridorDoor } from '@bratura/ui';
import Link from 'next/link';
import { localizedPathFromLocale, type SitePath } from '@/features/common/utils/locale-path';
import { APP_PAGES, appRoomFromPage } from './appPages';
import { APP_CONTENT } from './content';
import { SignOutButton } from './SignOutButton';

/**
 * The signed-in area's rooms as doors along a corridor, the exit at its end; the current page is
 * marked for screen readers. From `md` up only: on a phone the bottom map carries both.
 */
export function AppNav({ locale, currentPath }: { locale: Locale; currentPath: SitePath }) {
  const content = APP_CONTENT[locale];
  return (
    <nav aria-label={content.nav} className="mt-8 hidden md:block print:hidden">
      <Corridor exit={<SignOutButton locale={locale} size="compact" />}>
        {APP_PAGES.map((page, index) => {
          const room = appRoomFromPage(locale, page, index);
          const isCurrent = room.path === currentPath;
          return (
            <CorridorDoor key={room.path} caption={room.caption} current={isCurrent}>
              <Link
                href={localizedPathFromLocale(locale, room.path)}
                aria-current={isCurrent ? 'page' : undefined}
              >
                {room.name}
              </Link>
            </CorridorDoor>
          );
        })}
      </Corridor>
    </nav>
  );
}
