import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Heading } from '@bratura/ui';
import { SectionColumns } from '@/features/landing/pages/sections/common/SectionColumns';
import { SECTION_IDS } from '@/features/landing/pages/sections/common/sectionIds';
import { titleIdFromSectionId } from '@/features/landing/pages/sections/common/titleIdFromSectionId';
import { WHY_IT_MATTERS_CONTENT } from './content';
import { TicketStack } from './TicketStack';

export function WhyItMatters({ locale }: { locale: Locale }) {
  const content = WHY_IT_MATTERS_CONTENT[locale];
  return (
    <SectionColumns id={SECTION_IDS.whyItMatters}>
      <div className="grid content-start gap-10">
        <Heading id={titleIdFromSectionId(SECTION_IDS.whyItMatters)} className="max-w-[20ch]">
          {content.title}
        </Heading>
        <TicketStack tickets={content.tickets} />
      </div>
      <div className="grid max-w-[60ch] content-start gap-5 text-lg">
        {content.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <p className="border-t border-border pt-5 text-base text-muted-foreground">
          {content.sources}
        </p>
      </div>
    </SectionColumns>
  );
}
