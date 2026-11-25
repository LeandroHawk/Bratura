'use client';

import type { CallNoticeCard as CallNoticeCardData } from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-cards/query';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Badge, Button, ButtonLink, Card, Heading, Tag } from '@bratura/ui';
import type { CSSProperties } from 'react';
import { NewTabHint } from '@/features/common/components/NewTabHint';
import { CREATOR_LABELS } from '@/features/common/content/creator-labels';
import { formattedDayOfInstant } from '@bratura/shared/primitives/code/calendar/format';
import { formattedAmountInCents } from '@/features/common/utils/format';
import {
  artFormName,
  CALL_NOTICE_LANGUAGE,
  callNoticeStatus,
  CLASSIFICATION_TONE,
  closeText,
  STATUS_TONE,
} from './callNoticeTexts';
import { CALL_NOTICES_CONTENT } from './content';
import { passCheckoutUrlFor } from './passCheckoutUrl';

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
  const passUrl = passCheckoutUrlFor(classification);

  const facts = [
    [content.card.closes, closeText(callNotice, locale)],
    [content.card.amount, amount === null ? null : formattedAmountInCents(amount, locale)],
    [content.card.opens, registrationOpens && formattedDayOfInstant(registrationOpens.at, locale)],
    [content.card.published, formattedDayOfInstant(callNotice.firstSeenAt, locale)],
  ] as const;

  return (
    <Card
      as="article"
      className="rise-in grid content-start gap-4 shadow-lifted"
      style={{ '--rise-index': Math.min(index, 8) } as CSSProperties}
    >
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONE[status]} variant="dot">
            {content.status[status]}
          </Badge>
          <Badge tone={CLASSIFICATION_TONE[classification]}>
            {content.classification[classification]}
          </Badge>
          {callNotice.isNew && <Tag size="sm">{content.card.isNew}</Tag>}
        </div>
        <div className="grid gap-1.5">
          {/* Four lines at most; the details show it whole and a screen reader reads it all. */}
          <Heading size="item" lang={CALL_NOTICE_LANGUAGE} className="line-clamp-4">
            {callNotice.title}
          </Heading>
          <p className="text-small text-muted-foreground">
            {content.card.organizer}:{' '}
            <span lang={CALL_NOTICE_LANGUAGE}>{callNotice.organizer}</span>
            {' · '}
            <a
              href={callNotice.officialUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-sm font-semibold text-foreground underline underline-offset-4 focus-ring"
            >
              {content.card.officialSource}
              <NewTabHint locale={locale} />
            </a>
          </p>
        </div>
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

      <dl className="grid divide-y divide-sand-edge border-y border-sand-edge text-small">
        {facts.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 py-2">
            <dt className="text-sand-ink">{label}</dt>
            <dd className="shrink-0 text-right font-semibold whitespace-nowrap">
              {value ?? <span className="font-normal text-muted-foreground">{notInformed}</span>}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="sm"
            variant={passUrl ? 'ghost' : 'primary'}
            onClick={onOpenDetails}
            className="w-full"
          >
            {detailsLabel}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            aria-pressed={isSaved}
            onClick={onToggleSaved}
            className="w-full"
          >
            {isSaved ? content.card.saved : content.card.save}
          </Button>
        </div>
        {passUrl && (
          <div className="grid gap-1.5">
            <ButtonLink
              size="sm"
              href={passUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full"
            >
              {content.details.passCta}
              <NewTabHint locale={locale} />
            </ButtonLink>
            <p className="text-center text-caption text-muted-foreground">
              {content.details.passCardNote}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
