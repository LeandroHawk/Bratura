'use client';

import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { MuseumMap, MuseumMapRoom, MuseumMapRooms, PullCord } from '@bratura/ui';
import Link from 'next/link';
import { APP_PAGES, appRoomFromPage } from '@/features/common/components/app/appPages';
import { APP_CONTENT } from '@/features/common/components/app/content';
import { SignOutButton } from '@/features/common/components/app/SignOutButton';
import { PUBLIC_PATHS, ROUTES } from '@/features/common/config/routes';
import { useDemoState } from '@/features/common/data/demoStore';
import { localizedPathFromLocale, type SitePath } from '@/features/common/utils/locale-path';
import { LAYOUT_CONTENT } from './content';
import { LanguageSwitch } from './LanguageSwitch';

type Room = { path: SitePath; name: string; caption: string; number?: string };

/**
 * A phone's way around, below `md`: the signed-in pages as numbered rooms, the public ones as the
 * ground floor; the language by the title, the cord in the current room, the exit at the door.
 */
export function MuseumMapNav({ locale, path }: { locale: Locale; path?: SitePath }) {
  const content = LAYOUT_CONTENT[locale];
  const map = content.map;
  const appContent = APP_CONTENT[locale];
  const state = useDemoState();

  const areaRooms: Room[] = APP_PAGES.map((page, index) => appRoomFromPage(locale, page, index));
  const publicRoomName: Record<(typeof PUBLIC_PATHS)[number], string> = {
    [ROUTES.home]: map.lobby,
    [ROUTES.signUp]: appContent.signUp,
    [ROUTES.signIn]: appContent.signIn,
  };
  const groundFloor: Room[] = PUBLIC_PATHS.map((publicPath) => ({
    path: publicPath,
    name: publicRoomName[publicPath],
    caption: map.groundFloor,
  }));
  const isInArea = areaRooms.some((room) => room.path === path);
  const rooms = isInArea ? areaRooms : groundFloor;
  const current = rooms.find((room) => room.path === path);
  const plaque = current ?? { caption: map.groundFloor, name: map.offMap };
  const cordRoom = current ?? rooms[0];

  return (
    <MuseumMap
      copy={map}
      plaque={plaque}
      aside={<LanguageSwitch locale={locale} path={path} size="compact" />}
      className="md:hidden"
    >
      <nav aria-label={isInArea ? appContent.nav : map.title}>
        <MuseumMapRooms
          exit={isInArea && state?.isSignedIn ? <SignOutButton locale={locale} /> : undefined}
        >
          {rooms.map((room) => {
            const isCurrent = room === current;
            return (
              <MuseumMapRoom
                key={room.path}
                caption={room.caption}
                current={isCurrent}
                fixture={
                  room === cordRoom ? (
                    <PullCord copy={content.pullCord} size="compact" />
                  ) : undefined
                }
              >
                <Link
                  href={localizedPathFromLocale(locale, room.path)}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {room.name}
                </Link>
              </MuseumMapRoom>
            );
          })}
        </MuseumMapRooms>
      </nav>
    </MuseumMap>
  );
}
