'use client';

import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Card, Heading } from '@bratura/ui';
import { useState } from 'react';
import type { SignedInState } from '@/features/common/components/app/SignedInArea';
import { CREATOR_LABELS } from '@/features/common/content/creator-labels';
import { PORTFOLIO_SECTION_IDS } from '@/features/common/config/portfolio-section-ids';
import { useKeptFileUrl } from '@/features/portfolio/pages/sections/common/useKeptFileUrl';
import { SUMMARY_CONTENT } from './content';

/** Up to two initials, for the round mark that stands where no photo was attached. */
function initialsFromName(name: string) {
  const words = name.trim().split(/\s+/);
  return [words[0], words.length > 1 ? words.at(-1) : undefined]
    .map((word) => word?.[0]?.toUpperCase() ?? '')
    .join('');
}

/** Who the portfolio belongs to and how much of what calls ask for is already there. */
export function Summary({ locale, state }: { locale: Locale; state: SignedInState }) {
  const content = SUMMARY_CONTENT[locale];
  const labels = CREATOR_LABELS[locale];
  const { creator, portfolioItems } = state;
  // Read once, when the section mounts: a render must give the same answer twice.
  const [currentYear] = useState(() => new Date().getFullYear());
  const name = creator.artisticName ?? creator.fullName ?? creator.email;
  const photoUrl = useKeptFileUrl(creator.profileImage?.storageKey);
  const hasItem = (kind: string) => portfolioItems.some((item) => item.kind === kind);

  const steps = [
    { label: content.steps.biography, isDone: creator.biography !== null, id: 'profile' },
    {
      label: content.steps.mainCulturalArea,
      isDone: creator.mainCulturalArea !== null,
      id: 'profile',
    },
    {
      label: content.steps.activityStartYear,
      isDone: creator.activityStartYear !== null,
      id: 'profile',
    },
    { label: content.steps.experience, isDone: hasItem('culturalExperience'), id: 'experiences' },
    { label: content.steps.project, isDone: hasItem('culturalProject'), id: 'projects' },
    { label: content.steps.document, isDone: hasItem('document'), id: 'documents' },
  ] as const;
  const doneCount = steps.filter((step) => step.isDone).length;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="flex flex-wrap items-center gap-5">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob: URL
          <img
            src={photoUrl}
            alt={content.photoAlt(name)}
            className="rise-in size-24 shrink-0 rounded-paint border-2 border-foreground bg-card object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="rise-in inline-flex size-24 shrink-0 items-center justify-center rounded-paint border-2 border-foreground bg-card font-display text-4xl font-bold"
          >
            {initialsFromName(name)}
          </span>
        )}
        <div className="grid gap-1.5">
          <p className="font-semibold text-muted-foreground">{content.greeting}</p>
          <Heading as="h1" size="section">
            {name}
          </Heading>
          <p className="text-muted-foreground">
            {[
              creator.mainCulturalArea && labels.culturalArea[creator.mainCulturalArea],
              creator.activityStartYear !== null &&
                content.yearsOfActivity(currentYear - creator.activityStartYear),
              `${creator.city} - ${creator.state}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </div>

      <Card className="rise-in grid gap-3 [--rise-index:2] print:hidden">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Heading as="h2" size="item">
            {content.progressTitle}
          </Heading>
          <p className="text-small font-semibold">{content.progress(doneCount, steps.length)}</p>
        </div>
        <div
          role="progressbar"
          aria-label={content.progressTitle}
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={doneCount}
          className="h-2.5 overflow-hidden rounded-full bg-border"
        >
          <div
            className="h-full origin-left rounded-full bg-status-open transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {steps.map((step) => (
            <li key={step.label} className="text-small">
              <a
                href={`#${PORTFOLIO_SECTION_IDS[step.id]}`}
                className="rounded-sm focus-ring hover:underline"
              >
                <span aria-hidden="true">{step.isDone ? '✓ ' : '○ '}</span>
                {step.label}
                <span className="text-muted-foreground">
                  {' '}
                  ({step.isDone ? content.done : content.missing})
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
