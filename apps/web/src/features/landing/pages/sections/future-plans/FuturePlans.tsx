import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Heading } from '@bratura/ui';
import { SectionColumns } from '@/features/landing/pages/sections/common/SectionColumns';
import { SECTION_IDS } from '@/features/landing/pages/sections/common/sectionIds';
import { titleIdFromSectionId } from '@/features/landing/pages/sections/common/titleIdFromSectionId';
import { WallLabel } from '@/features/landing/pages/sections/common/WallLabel';
import { FUTURE_PLANS_CONTENT } from './content';
import { FloorPlan } from './FloorPlan';

/** Planned features, drawn as a floor plan: one building, two entrances. */
export function FuturePlans({ locale, roomCount }: { locale: Locale; roomCount: number }) {
  const content = FUTURE_PLANS_CONTENT[locale];
  return (
    <SectionColumns id={SECTION_IDS.futurePlans}>
      <div className="grid content-start gap-4">
        <Heading id={titleIdFromSectionId(SECTION_IDS.futurePlans)} className="max-w-[20ch]">
          {content.title}
        </Heading>
        <p className="max-w-[40ch] text-muted-foreground">{content.lead}</p>
        <div className="mt-6">
          <FloorPlan locale={locale} roomCount={roomCount} />
        </div>
      </div>
      <ul className="grid max-w-[60ch] gap-6">
        {Object.values(content.plans).map((plan) => (
          <li key={plan.title} className="grid gap-1 border-t border-border pt-5">
            <WallLabel title={plan.title} medium={plan.medium}>
              <p className="text-lg">{plan.text}</p>
            </WallLabel>
          </li>
        ))}
      </ul>
    </SectionColumns>
  );
}
