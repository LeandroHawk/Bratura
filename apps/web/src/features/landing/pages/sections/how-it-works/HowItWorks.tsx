import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Heading } from '@bratura/ui';
import { RoomLabel } from '@/features/landing/pages/sections/common/RoomLabel';
import { SectionBand } from '@/features/landing/pages/sections/common/SectionBand';
import { SECTION_IDS } from '@/features/landing/pages/sections/common/sectionIds';
import { titleIdFromSectionId } from '@/features/landing/pages/sections/common/titleIdFromSectionId';
import { WallLabel } from '@/features/landing/pages/sections/common/WallLabel';
import { HOW_IT_WORKS_CONTENT } from './content';

export function HowItWorks({ locale }: { locale: Locale }) {
  const content = HOW_IT_WORKS_CONTENT[locale];
  return (
    <SectionBand id={SECTION_IDS.howItWorks}>
      <Heading id={titleIdFromSectionId(SECTION_IDS.howItWorks)} className="max-w-[24ch]">
        {content.title}
      </Heading>
      <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {content.rooms.map((room, i) => (
          <li
            key={room.title}
            className="grid content-start gap-2 border-l-2 border-primary bg-background py-4 pr-4 pl-5"
          >
            <RoomLabel locale={locale} number={i + 1} />
            <WallLabel title={room.title} medium={room.medium}>
              <p className="text-small">{room.text}</p>
            </WallLabel>
          </li>
        ))}
      </ol>
    </SectionBand>
  );
}
