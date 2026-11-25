import type {
  CallNoticeDetails as CallNoticeDetailsData,
  MatchRequirementCheck,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-details/query';
import type { MatchCheckStatus } from '@bratura/shared/entities/match/enums/check-status/enum';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Badge } from '@bratura/ui';
import type { ReactNode } from 'react';
import {
  callNoticeStatus,
  CLASSIFICATION_TONE,
  closeText,
  STATUS_TONE,
} from '@/features/call-notices/pages/sections/common/callNoticeTexts';
import { CALL_NOTICE_LABELS } from '@/features/call-notices/pages/sections/common/content';
import { CallNoticeWords } from '@/features/call-notices/pages/sections/common/CallNoticeWords';
import { ExternalButtonLink } from '@/features/call-notices/pages/sections/common/ExternalButtonLink';
import { passCheckoutUrlFor } from '@/features/call-notices/pages/sections/common/passCheckoutUrl';
import { NotInformed } from '@/features/common/components/NotInformed';
import { formattedAmountInCents } from '@/features/common/utils/format';
import { StatusDot, STATUS_ORDER } from './CheckGroups';
import { CALL_NOTICE_DETAILS_CONTENT } from './content';

/**
 * The card on top of the details: status and fit, who publishes, the deadline and amount, how
 * many of the documents to apply (`toApply`) the portfolio holds, and where to apply.
 */
export function CallNoticeSummary({
  locale,
  details,
  toApply,
}: {
  locale: Locale;
  details: CallNoticeDetailsData;
  toApply: MatchRequirementCheck[];
}) {
  const copy = CALL_NOTICE_DETAILS_CONTENT[locale];
  const labels = CALL_NOTICE_LABELS[locale];
  const { matchChecks, classification } = details;
  const status = callNoticeStatus(details);
  const passUrl = passCheckoutUrlFor(classification);
  const amount = details.largestAmountPerProjectInCents;
  const keyFacts: [label: string, value: ReactNode][] = [
    [labels.facts.deadline, closeText(details, locale)],
    [labels.facts.amount, amount !== null && formattedAmountInCents(amount, locale)],
  ];
  const tally = (checkStatus: MatchCheckStatus) =>
    toApply.filter((requirement) => requirement.status === checkStatus).length;
  const held = tally('met');

  return (
    <div className="grid gap-4 rounded-2xl border border-sand-edge bg-card p-5 shadow-lifted">
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONE[status]} variant="dot">
            {labels.status[status]}
          </Badge>
          {classification ? (
            <Badge tone={CLASSIFICATION_TONE[classification]}>
              {labels.classification[classification]}
            </Badge>
          ) : (
            <span className="text-small text-muted-foreground">{copy.notAnalyzed}</span>
          )}
        </div>
        <p className="text-small text-muted-foreground">
          {labels.facts.organizer}: <CallNoticeWords>{details.organizer}</CallNoticeWords>
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
        {keyFacts.map(([label, value]) => (
          <div key={label}>
            <dt className="text-caption font-semibold text-sand-ink">{label}</dt>
            <dd className="font-semibold">{value || <NotInformed locale={locale} />}</dd>
          </div>
        ))}
      </dl>
      {matchChecks && toApply.length > 0 && (
        <div className="grid gap-2 border-t border-sand-edge pt-4 text-small">
          <p className="flex flex-wrap items-baseline justify-between gap-x-4">
            <span>{copy.toApplyTitle}</span>
            <span className="font-semibold">{copy.portfolioHas(held, toApply.length)}</span>
          </p>
          {/* The line above already says how many; the bar is decoration. */}
          <span className="h-2 overflow-hidden rounded-full bg-sand-edge" aria-hidden="true">
            <span
              className="block h-full rounded-full bg-status-open"
              style={{ width: `${(held / toApply.length) * 100}%` }}
            />
          </span>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {STATUS_ORDER.map((checkStatus) => (
              <li key={checkStatus} className="flex items-center gap-1.5">
                <StatusDot status={checkStatus} />
                {copy.paperStatus[checkStatus]}: {tally(checkStatus)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Where the creator applies; secondary beside the pass, the paid way to prepare it. */}
      <div className="grid gap-1.5">
        <div className="flex flex-wrap gap-2">
          {passUrl && (
            <ExternalButtonLink size="sm" href={passUrl} locale={locale}>
              {labels.passCta}
            </ExternalButtonLink>
          )}
          <ExternalButtonLink
            size="sm"
            variant={passUrl ? 'ghost' : 'primary'}
            href={details.officialUrl}
            locale={locale}
          >
            {copy.officialPage}
          </ExternalButtonLink>
        </div>
        {passUrl && <p className="text-caption text-muted-foreground">{copy.passDetailsNote}</p>}
      </div>
    </div>
  );
}
