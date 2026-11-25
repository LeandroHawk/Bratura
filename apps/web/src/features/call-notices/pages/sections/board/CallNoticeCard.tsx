'use client';

import type { CallNoticeCard as CallNoticeCardData } from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-cards/query';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Badge, Button, Card, Heading, Tag } from '@bratura/ui';
import type { CSSProperties } from 'react';
import { ExternalLink } from '@/features/common/components/ExternalLink';
import { NotInformed } from '@/features/common/components/NotInformed';
import { formattedDayOfInstant } from '@bratura/shared/primitives/code/calendar/format';
import { formattedAmountInCents } from '@/features/common/utils/format';
import {
  artFormName,
  CALL_NOTICE_LANGUAGE,
  callNoticeStatus,
  CLASSIFICATION_TONE,
  closeText,
  STATUS_TONE,
} from '@/features/call-notices/pages/sections/common/callNoticeTexts';
import { CALL_NOTICE_LABELS } from '@/features/call-notices/pages/sections/common/content';
import { CallNoticeWords } from '@/features/call-notices/pages/sections/common/CallNoticeWords';
import { ExternalButtonLink } from '@/features/call-notices/pages/sections/common/ExternalButtonLink';
import { passCheckoutUrlFor } from '@/features/call-notices/pages/sections/common/passCheckoutUrl';
import { CALL_NOTICE_BOARD_CONTENT } from './content';

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
  const content = CALL_NOTICE_BOARD_CONTENT[locale];
  const labels = CALL_NOTICE_LABELS[locale];
  const { registrationOpens, largestAmountPerProjectInCents: amount, classification } = callNotice;
  const status = callNoticeStatus(callNotice);
  const passUrl = passCheckoutUrlFor(classification);

  const facts = [
    [labels.facts.deadline, closeText(callNotice, locale)],
    [labels.facts.amount, amount === null ? null : formattedAmountInCents(amount, locale)],
    [labels.facts.opens, registrationOpens && formattedDayOfInstant(registrationOpens.at, locale)],
    [content.published, formattedDayOfInstant(callNotice.firstSeenAt, locale)],
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
            {labels.status[status]}
          </Badge>
          <Badge tone={CLASSIFICATION_TONE[classification]}>
            {labels.classification[classification]}
          </Badge>
          {callNotice.isNew && <Tag size="sm">{content.isNew}</Tag>}
        </div>
        <div className="grid gap-1.5">
          {/* Four lines at most; the details show it whole and a screen reader reads it all. */}
          <Heading size="item" lang={CALL_NOTICE_LANGUAGE} className="line-clamp-4">
            {callNotice.title}
          </Heading>
          <p className="text-small text-muted-foreground">
            {labels.facts.organizer}: <CallNoticeWords>{callNotice.organizer}</CallNoticeWords>
            {' · '}
            <ExternalLink href={callNotice.officialUrl} locale={locale} className="text-foreground">
              {content.officialSource}
            </ExternalLink>
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
          // A long value (an English deadline with its time zone) drops under its label and wraps;
          // kept on one line, it widened the whole page past a 360px phone.
          <div key={label} className="flex flex-wrap items-baseline justify-between gap-x-4 py-2">
            <dt className="text-sand-ink">{label}</dt>
            <dd className="ml-auto text-right font-semibold">
              {value ?? <NotInformed locale={locale} />}
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
            {isSaved ? content.saved : content.save}
          </Button>
        </div>
        {passUrl && (
          <div className="grid gap-1.5">
            <ExternalButtonLink size="sm" href={passUrl} locale={locale} className="w-full">
              {labels.passCta}
            </ExternalButtonLink>
            <p className="text-center text-caption text-muted-foreground">{content.passCardNote}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
