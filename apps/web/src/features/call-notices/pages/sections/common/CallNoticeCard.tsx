'use client';

import type { CallNoticeCard as CallNoticeCardData } from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-cards/query';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Badge, Button, Card, Heading, Tag } from '@bratura/ui';
import type { CSSProperties } from 'react';
import { NewTabHint } from '@/features/common/components/NewTabHint';
import { CREATOR_LABELS } from '@/features/common/content/creator-labels';
import { formattedAmountInCents, formattedDayOfInstant } from '@/features/common/utils/format';
import {
  artFormName,
  CALL_NOTICE_LANGUAGE,
  callNoticeStatus,
  CLASSIFICATION_TONE,
  closeText,
  STATUS_TONE,
} from './callNoticeTexts';
import { CALL_NOTICES_CONTENT } from './content';

/** One call in a list: what it is, where it stands, how it fits, and the ways further in. */
export function CallNoticeCard({
  locale,
  callNotice,
  isSaved,
  index,
  detailsLabel,
  onOpenDetails,
  onToggleSaved,
}: {
  locale: Locale;
  callNotice: CallNoticeCardData;
  isSaved: boolean;
  /** The card's place in the list: each one rises a moment after the one before. */
  index: number;
  /** What the main button says: "see details" or "check my eligibility". */
  detailsLabel: string;
  onOpenDetails: () => void;
  onToggleSaved: () => void;
}) {
  const content = CALL_NOTICES_CONTENT[locale];
  const { notInformed } = CREATOR_LABELS[locale];
  const { registrationOpens, largestAmountPerProjectInCents: amount, classification } = callNotice;
  const status = callNoticeStatus(callNotice);

  const facts = [
    [content.card.amount, amount === null ? null : formattedAmountInCents(amount, locale)],
    [content.card.opens, registrationOpens && formattedDayOfInstant(registrationOpens.at, locale)],
    [content.card.closes, closeText(callNotice, locale)],
    [content.card.published, formattedDayOfInstant(callNotice.firstSeenAt, locale)],
  ] as const;

  return (
    <Card
      as="article"
      className="rise-in grid content-start gap-4"
      style={{ '--rise-index': Math.min(index, 8) } as CSSProperties}
    >
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONE[status]}>{content.status[status]}</Badge>
          <Badge tone={CLASSIFICATION_TONE[classification]}>
            {content.classification[classification]}
          </Badge>
          {callNotice.isNew && <Tag size="sm">{content.card.isNew}</Tag>}
        </div>
        <Heading size="item" lang={CALL_NOTICE_LANGUAGE}>
          {callNotice.title}
        </Heading>
        <p className="text-small text-muted-foreground">
          {content.card.organizer}: <span lang={CALL_NOTICE_LANGUAGE}>{callNotice.organizer}</span>
        </p>
      </div>

      {callNotice.artForms.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {callNotice.artForms.map((artForm) => (
            <li key={artForm}>
              <Tag size="sm">{artFormName(artForm, locale)}</Tag>
            </li>
          ))}
        </ul>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-small">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt className="text-caption font-semibold text-muted-foreground">{label}</dt>
            <dd>{value ?? <span className="text-muted-foreground">{notInformed}</span>}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Button size="sm" onClick={onOpenDetails}>
          {detailsLabel}
        </Button>
        <Button size="sm" variant="ghost" aria-pressed={isSaved} onClick={onToggleSaved}>
          {isSaved ? content.card.saved : content.card.save}
        </Button>
        <a
          href={callNotice.officialUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-sm text-small font-semibold underline underline-offset-4 focus-ring"
        >
          {content.card.officialSource}
          <NewTabHint locale={locale} />
        </a>
      </div>
    </Card>
  );
}
