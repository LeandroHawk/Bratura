import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import {
  Corridor,
  CorridorDoor,
  ExitSign,
  MuseumMap,
  MuseumMapRoom,
  MuseumMapRooms,
  PullCord,
} from '@bratura/ui';
import Link from 'next/link';
import { APP_PAGES, appRoomFromPage } from '@/features/common/components/app/appPages';
import { APP_CONTENT } from '@/features/common/components/app/content';
import { LAYOUT_CONTENT } from '@/features/common/components/layout/content';
import { localizedPathFromLocale } from '@/features/common/utils/locale-path';
import { StyleguideBlock } from '@/features/styleguide/pages/sections/common/StyleguideBlock';
import { NAVIGATION_CONTENT } from './content';

/**
 * The signed-in area's rooms as the corridor and as the phone's map, the first room as the
 * visitor's. No `aria-current`: the page open is this one, not that room.
 */
export function Navigation({ locale }: { locale: Locale }) {
  const content = NAVIGATION_CONTENT[locale];
  const appContent = APP_CONTENT[locale];
  const layoutContent = LAYOUT_CONTENT[locale];
  const rooms = APP_PAGES.map((page, index) => ({
    ...appRoomFromPage(locale, page, index),
    href: localizedPathFromLocale(locale, page.path),
    current: index === 0,
  }));
  return (
    <StyleguideBlock title={content.title}>
      <p className="text-small text-muted-foreground">{content.corridor}</p>
      {/* A tablet's corridor is wider than a phone: it scrolls inside its frame, not the page. */}
      <div className="overflow-x-auto pt-2 pb-1">
        <Corridor
          className="min-w-max"
          exit={<ExitSign label={appContent.exit} hint={appContent.exitHint} size="compact" />}
        >
          {rooms.map((room) => (
            <CorridorDoor key={room.href} caption={room.caption} current={room.current}>
              <Link href={room.href}>{room.name}</Link>
            </CorridorDoor>
          ))}
        </Corridor>
      </div>
      <p className="text-small text-muted-foreground">{content.map}</p>
      {/* Layout containment holds the plaque, fixed on a phone, inside this frame. */}
      <div className="relative h-24 rounded-xl border border-border contain-layout">
        <MuseumMap copy={layoutContent.map} plaque={appRoomFromPage(locale, APP_PAGES[0], 0)}>
          <MuseumMapRooms exit={<ExitSign label={appContent.exit} hint={appContent.exitHint} />}>
            {rooms.map((room) => (
              <MuseumMapRoom
                key={room.href}
                caption={room.caption}
                current={room.current}
                fixture={
                  room.current ? (
                    <PullCord copy={layoutContent.pullCord} size="compact" />
                  ) : undefined
                }
              >
                <Link href={room.href}>{room.name}</Link>
              </MuseumMapRoom>
            ))}
          </MuseumMapRooms>
        </MuseumMap>
      </div>
    </StyleguideBlock>
  );
}
