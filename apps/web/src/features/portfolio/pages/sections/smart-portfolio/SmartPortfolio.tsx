'use client';

import type { Creator } from '@bratura/shared/entities/creator/entity';
import type { CulturalExperiencePortfolioItem } from '@bratura/shared/entities/portfolio-item/kinds/cultural-experience/variant';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Button, Card, Heading } from '@bratura/ui';
import type { CSSProperties } from 'react';
import { formattedPlainDate } from '@bratura/shared/primitives/code/calendar/format';

import { PORTFOLIO_SECTION_IDS } from '@/features/common/config/portfolio-section-ids';
import { PORTFOLIO_COMMON_CONTENT } from '@/features/portfolio/pages/sections/common/content';
import { SMART_PORTFOLIO_CONTENT } from './content';

/** Under this many characters a biography says too little for a call's reader. */
const SHORT_BIOGRAPHY_LENGTH = 120;

export function SmartPortfolio({
  locale,
  creator,
  experiences,
}: {
  locale: Locale;
  creator: Creator;
  experiences: CulturalExperiencePortfolioItem[];
}) {
  const content = SMART_PORTFOLIO_CONTENT[locale];
  const { activityKind } = PORTFOLIO_COMMON_CONTENT[locale];
  const titleId = `${PORTFOLIO_SECTION_IDS.smartPortfolio}-title`;

  const dated = experiences
    .filter((experience) => experience.startDate !== null)
    .toSorted((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''));
  const years = [...new Set(dated.map((experience) => experience.startDate?.slice(0, 4)))];
  const withoutProof = experiences.filter(
    (experience) => experience.attachments.length === 0 && experience.links.length === 0,
  ).length;
  const withoutDate = experiences.length - dated.length;

  const checks = [
    creator.biography === null && content.checks.biographyMissing,
    creator.biography !== null &&
      creator.biography.length < SHORT_BIOGRAPHY_LENGTH &&
      content.checks.biographyShort,
    creator.activityDescription === null && content.checks.descriptionMissing,
    withoutProof > 0 && content.checks.experiencesWithoutProof(withoutProof),
    withoutDate > 0 && content.checks.experiencesWithoutDate(withoutDate),
  ].filter((check) => check !== false);

  return (
    <section
      id={PORTFOLIO_SECTION_IDS.smartPortfolio}
      aria-labelledby={titleId}
      className="grid gap-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <Heading id={titleId} size="card">
            {content.title}
          </Heading>
          <p className="max-w-[60ch] text-muted-foreground">{content.lead}</p>
        </div>
        <div className="grid justify-items-start gap-1 print:hidden sm:justify-items-end">
          <Button size="sm" onClick={() => window.print()}>
            {content.exportPdf}
          </Button>
          <p className="text-caption text-muted-foreground">{content.exportHint}</p>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="grid gap-4">
          <div className="grid gap-1">
            <Heading as="h3" size="item">
              {content.timelineTitle}
            </Heading>
            <p className="text-small text-muted-foreground">{content.timelineLead}</p>
          </div>
          {dated.length === 0 ? (
            <p className="text-muted-foreground">{content.timelineEmpty}</p>
          ) : (
            <ol className="grid gap-5">
              {years.map((year, index) => (
                <li
                  key={year}
                  className="rise-in grid gap-2 sm:grid-cols-[4.5rem_1fr]"
                  style={{ '--rise-index': Math.min(index, 8) } as CSSProperties}
                >
                  <p className="font-display text-2xl leading-none font-bold">{year}</p>
                  <ul className="grid gap-3 border-l-2 border-foreground pl-4">
                    {dated
                      .filter((experience) => experience.startDate?.startsWith(year ?? ''))
                      .map((experience) => (
                        <li key={experience.clientItemId} className="grid gap-0.5">
                          <p className="font-semibold">{experience.title}</p>
                          <p className="text-small text-muted-foreground">
                            {[
                              activityKind[experience.activityKind],
                              [experience.venue, experience.city, experience.state]
                                .filter(Boolean)
                                .join(', '),
                              experience.startDate &&
                                (experience.endDate
                                  ? content.period(
                                      formattedPlainDate(experience.startDate, locale),
                                      formattedPlainDate(experience.endDate, locale),
                                    )
                                  : formattedPlainDate(experience.startDate, locale)),
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        </li>
                      ))}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <div className="grid gap-5 print:hidden">
          <Card className="grid gap-3">
            <div className="grid gap-1">
              <Heading as="h3" size="item">
                {content.checksTitle}
              </Heading>
              <p className="text-caption text-muted-foreground">{content.checksLead}</p>
            </div>
            <ul className="grid gap-2 text-small">
              {checks.length === 0 ? (
                <li>{content.checks.allGood}</li>
              ) : (
                checks.map((check, index) => (
                  // A fixed list of checks in a fixed order: the position is the stable key.
                  <li key={index} className="border-l-2 border-status-soon pl-3">
                    {check}
                  </li>
                ))
              )}
            </ul>
          </Card>
          <Card className="grid justify-items-start gap-3">
            <Heading as="h3" size="item">
              {content.aiTitle}
            </Heading>
            <p id={`${titleId}-ai`} className="text-small text-muted-foreground">
              {content.aiLead}
            </p>
            <Button size="sm" variant="ghost" disabled aria-describedby={`${titleId}-ai`}>
              {content.generateWithAi}
            </Button>
          </Card>
        </div>
      </div>
    </section>
  );
}
