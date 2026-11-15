'use client';

import type {
  CallNoticeWithMatch,
  MatchClassification,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/eligible-call-notices/query';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Badge, Button, Card, Heading, Tag, type BadgeTone } from '@bratura/ui';
import { NewTabHint } from '@/features/common/components/NewTabHint';
import { CREATOR_LABELS } from '@/features/common/content/creator-labels';
import { formattedAmountInCents, formattedDayOfInstant } from '@/features/common/utils/format';
import { artFormName, justificationText, locationText } from './callNoticeTexts';
import { CALL_NOTICES_CONTENT } from './content';
import { callNoticeStatus, largestAmountInCents, type CallNoticeStatus } from './filtering';

export const STATUS_TONE: Record<CallNoticeStatus, BadgeTone> = {
  open: 'open',
  closingSoon: 'soon',
  closed: 'missing',
  notInformed: 'soon',
};

export const CLASSIFICATION_TONE: Record<MatchClassification, BadgeTone> = {
  eligible: 'open',
  almostEligible: 'soon',
  notEligible: 'missing',
};

/** One call in a list: what it is, where it stands, how it fits, and the ways further in. */
export function CallNoticeCard({
  locale,
  callNotice,
  isNew,
  isSaved,
  index,
  detailsLabel,
  onOpenDetails,
  onToggleSaved,
}: {
  locale: Locale;
  callNotice: CallNoticeWithMatch;
  isNew: boolean;
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
  const status = callNoticeStatus(callNotice);
  const amount = largestAmountInCents(callNotice);
  const { match, registrationOpens, registrationCloses } = callNotice;

  const facts = [
    [content.card.location, locationText(callNotice, locale)],
    [content.card.amount, amount === null ? null : formattedAmountInCents(amount, locale)],
    [content.card.opens, registrationOpens && formattedDayOfInstant(registrationOpens.at, locale)],
    [
      content.card.closes,
      registrationCloses && formattedDayOfInstant(registrationCloses.at, locale),
    ],
    [content.card.published, formattedDayOfInstant(callNotice.firstSeenAt, locale)],
  ] as const;

  return (
    <Card
      as="article"
      className="rise-in grid content-start gap-4"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONE[status]}>{content.status[status]}</Badge>
          {match && (
            <Badge tone={CLASSIFICATION_TONE[match.classification]}>
              {content.classification[match.classification]}
            </Badge>
          )}
          {isNew && <Tag size="sm">{content.card.isNew}</Tag>}
        </div>
        {/* What the call itself says stays in the call's language, whatever the page's. */}
        <Heading as="h3" size="item" lang="pt-BR">
          {callNotice.title}
        </Heading>
        <p className="text-small text-muted-foreground">
          {content.card.organizer}: {callNotice.organizer ?? notInformed}
        </p>
      </div>

      {callNotice.summary && (
        <p className="text-small" lang="pt-BR">
          {callNotice.summary}
        </p>
      )}

      <ul className="flex flex-wrap gap-1.5">
        {callNotice.opportunityKind && (
          <li>
            <Tag size="sm">{content.opportunityKind[callNotice.opportunityKind]}</Tag>
          </li>
        )}
        {callNotice.extraction?.artForms.map((artForm) => (
          <li key={artForm.value}>
            <Tag size="sm">{artFormName(artForm.value, locale)}</Tag>
          </li>
        ))}
      </ul>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-small">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt className="text-caption font-semibold text-muted-foreground">{label}</dt>
            <dd>{value ?? <span className="text-muted-foreground">{notInformed}</span>}</dd>
          </div>
        ))}
      </dl>

      <p className="border-l-2 border-foreground pl-3 text-small">
        {justificationText(callNotice, locale)}
      </p>

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
