import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Eyebrow, Heading, Tag } from '@bratura/ui';
import { SectionBand } from '@/features/landing/pages/sections/common/SectionBand';
import { SECTION_IDS } from '@/features/landing/pages/sections/common/sectionIds';
import { titleIdFromSectionId } from '@/features/landing/pages/sections/common/titleIdFromSectionId';
import { BUSINESS_MODEL_CONTENT } from './content';
import { Stage } from './Stage';
import { StageScenery } from './StageScenery';

/** A row of empty seats drawn above each paying side; the box seats get the house's brass. */
function Seats({ box }: { box: boolean }) {
  return (
    <span className="flex gap-1.5" aria-hidden="true">
      {Array.from({ length: box ? 3 : 7 }, (_, i) => (
        <span key={i} className={`h-3 w-5 rounded-t-md ${box ? 'bg-cord' : 'bg-primary/70'}`} />
      ))}
    </span>
  );
}

/**
 * Who uses and who pays, as a theatre: the free creator on a lit stage, the paying sides in the
 * audience, with the channels that reach them.
 */
export function BusinessModel({ locale }: { locale: Locale }) {
  const { title, lead, stage, audience } = BUSINESS_MODEL_CONTENT[locale];
  return (
    <SectionBand id={SECTION_IDS.businessModel}>
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr] lg:items-end">
        <Heading id={titleIdFromSectionId(SECTION_IDS.businessModel)}>
          {title.map((sentence) => (
            <span key={sentence} className="block">
              {sentence}
            </span>
          ))}
        </Heading>
        <p className="max-w-[52ch] text-muted-foreground">{lead}</p>
      </div>

      <Stage>
        <div className="grid gap-8 px-[15%] pt-14 xl:grid-cols-[1fr_minmax(0,30rem)_1fr] xl:items-end xl:gap-6 xl:px-32">
          <div className="grid justify-items-center gap-4 text-center xl:col-start-2 xl:row-start-1 xl:pb-10">
            <Heading as="h3" size="card">
              {stage.title}
            </Heading>
            <p className="grid">
              <span className="font-display text-5xl leading-none font-bold sm:text-6xl">
                {stage.price}
              </span>
              <span className="font-display text-muted-foreground italic">{stage.priceNote}</span>
            </p>
            <p className="max-w-[46ch] text-small">{stage.text}</p>
            <p className="font-semibold">{stage.promise}</p>
            <div className="grid justify-items-center gap-2">
              <p className="text-caption text-muted-foreground">{stage.includesLabel}</p>
              <ul className="flex flex-wrap justify-center gap-2">
                {stage.includes.map((item) => (
                  <Tag key={item} as="li" size="md" className="bg-card">
                    {item}
                  </Tag>
                ))}
              </ul>
            </div>
          </div>
          <StageScenery />
        </div>
      </Stage>

      <div className="grid gap-6">
        <div className="grid gap-2">
          <p className="font-display text-xl font-bold">{audience.label}</p>
          <p className="max-w-[70ch] text-small text-muted-foreground">{audience.channels}</p>
        </div>
        <ul className="grid gap-8 md:grid-cols-3 md:gap-6">
          {audience.rows.map((row) => (
            <li key={row.title} className="grid content-start gap-2 border-t border-border pt-5">
              <Seats box={row.box} />
              <Eyebrow as="span" className="mt-2">
                {row.seat} · {row.role}
              </Eyebrow>
              <Heading as="h3">{row.title}</Heading>
              <p className="font-display text-small text-muted-foreground italic">{row.pays}</p>
              <p className="text-small">{row.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </SectionBand>
  );
}
