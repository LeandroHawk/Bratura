import type { MatchRequirementCheck } from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-details/query';
import type { MatchCheckStatus } from '@bratura/shared/entities/match/enums/check-status/enum';
import { PortfolioDocumentKindEnum } from '@bratura/shared/entities/portfolio-item/enums/document-kind/enum';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import type { ReactNode } from 'react';
import { CALL_NOTICE_LANGUAGE } from '@/features/call-notices/pages/sections/common/callNoticeTexts';
import { CallNoticeWords } from '@/features/call-notices/pages/sections/common/CallNoticeWords';
import { CREATOR_LABELS } from '@/features/common/content/creator-labels';
import { CALL_NOTICE_DETAILS_CONTENT } from './content';

/** A list of the details: items split by the sand's hairline. */
export const CHECK_LIST = 'divide-y divide-sand-edge border-y border-sand-edge';

/** The order a creator acts on: what is missing, what to check, what is already fine. */
export const STATUS_ORDER = [
  'notMet',
  'needsConfirmation',
  'met',
] as const satisfies MatchCheckStatus[];

const STATUS_DOT: Record<MatchCheckStatus, string> = {
  met: 'bg-status-open',
  notMet: 'bg-status-missing',
  needsConfirmation: 'bg-muted-foreground',
};

/** The status's colour beside its words; the words carry the status, the dot only colours it. */
export function StatusDot({ status }: { status: MatchCheckStatus }) {
  return (
    <span
      className={`inline-block size-2.5 shrink-0 rounded-full ${STATUS_DOT[status]}`}
      aria-hidden="true"
    />
  );
}

/** The call's own words, behind a disclosure so the list reads as items, in the call's language. */
export function Quote({ locale, children }: { locale: Locale; children: string }) {
  return (
    <details className="text-caption text-sand-ink">
      <summary className="w-fit cursor-pointer rounded-sm underline underline-offset-4 focus-ring">
        {CALL_NOTICE_DETAILS_CONTENT[locale].quoteToggle}
      </summary>
      <p className="mt-1.5 border-l-2 border-sand-edge pl-3 text-small text-muted-foreground">
        <q lang={CALL_NOTICE_LANGUAGE}>{children}</q>
      </p>
    </details>
  );
}

/** One thing the call asks: a short name, the call's own wording under it, and its passage. */
export type CheckItem = {
  status: MatchCheckStatus;
  title: ReactNode;
  detail?: string;
  note?: string | false | null;
  quote: string;
};

/**
 * Items grouped by status, each group named once instead of a badge on every line, so a long list
 * reads as "what is missing, what to check, what is fine". Empty groups are left out.
 */
export function CheckGroups({
  locale,
  items,
  statusLabel,
}: {
  locale: Locale;
  items: CheckItem[];
  statusLabel: Record<MatchCheckStatus, string>;
}) {
  return (
    <div className="grid gap-5">
      {STATUS_ORDER.map((status) => {
        const group = items.filter((item) => item.status === status);
        if (group.length === 0) return null;
        return (
          <section key={status} className="grid gap-1">
            <h4 className="flex items-center gap-2 font-display font-bold text-sand-ink">
              <StatusDot status={status} />
              {statusLabel[status]}
              <span className="font-body font-normal">({group.length})</span>
            </h4>
            <ul className={CHECK_LIST}>
              {group.map((item, index) => (
                <li key={`${status}-${index}`} className="grid gap-1 py-3">
                  <p className="font-semibold">{item.title}</p>
                  {item.detail && (
                    <p className="text-small text-muted-foreground" lang={CALL_NOTICE_LANGUAGE}>
                      {item.detail}
                    </p>
                  )}
                  {item.note && <p className="text-small">{item.note}</p>}
                  <Quote locale={locale}>{item.quote}</Quote>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/** A document the call asks, named by its kind when we know it, the call's wording under it. */
export function checkItemFromRequirement(
  locale: Locale,
  requirement: MatchRequirementCheck,
): CheckItem {
  const copy = CALL_NOTICE_DETAILS_CONTENT[locale];
  const kind = PortfolioDocumentKindEnum.safeParse(requirement.kind);
  const named = kind.success && kind.data !== 'other';
  return {
    status: requirement.status,
    title: named ? (
      CREATOR_LABELS[locale].documentKind[kind.data]
    ) : (
      <CallNoticeWords>{requirement.detail}</CallNoticeWords>
    ),
    detail: named ? requirement.detail : undefined,
    note: requirement.paperValidity && copy.paperValidity[requirement.paperValidity],
    quote: requirement.quote,
  };
}
