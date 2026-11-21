'use client';

import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { useMemo, useState } from 'react';
import { callNoticesWithMatch } from '@/features/call-notices/data/callNoticesWithMatch';
import { SignedInArea, type SignedInState } from '@/features/common/components/app/SignedInArea';
import { ROUTES } from '@/features/common/config/routes';
import { setSavedCallNotice } from '@/features/common/data/demoStore';
import { CallNoticeCard } from './sections/common/CallNoticeCard';
import { CallNoticeDetails } from './sections/common/CallNoticeDetails';
import { CallNoticeFilters } from './sections/common/CallNoticeFilters';
import { CALL_NOTICES_CONTENT } from './sections/common/content';
import {
  callNoticeStatus,
  emptyCallNoticeFilters,
  filteredCallNotices,
  isNewCallNotice,
  type CallNoticeFilterValues,
  type CallNoticeSort,
} from './sections/common/filtering';
import { MatchSummary } from './sections/match-summary/MatchSummary';
import { OverviewCounters } from './sections/overview-counters/OverviewCounters';

/** The two screens over the same calls: the fit with the portfolio first, or every call. */
export type CallNoticesView = 'matches' | 'overview';

const VIEW: Record<
  CallNoticesView,
  { path: typeof ROUTES.matches | typeof ROUTES.callNotices; sorts: readonly CallNoticeSort[] }
> = {
  matches: {
    path: ROUTES.matches,
    sorts: ['bestMatch', 'closestDeadline', 'largestAmount', 'newest'],
  },
  overview: {
    path: ROUTES.callNotices,
    sorts: ['newest', 'closestDeadline', 'largestAmount', 'alphabetical'],
  },
};

function CallNotices({
  locale,
  view,
  state,
}: {
  locale: Locale;
  view: CallNoticesView;
  state: SignedInState;
}) {
  const content = CALL_NOTICES_CONTENT[locale];
  const { sorts } = VIEW[view];
  const defaultSort = sorts[0] ?? 'newest';
  // Read once, when the screen mounts: a render must give the same answer twice.
  const [now] = useState(() => Date.now());
  const [filters, setFilters] = useState<CallNoticeFilterValues>({
    ...emptyCallNoticeFilters,
    sort: defaultSort,
  });
  const [openId, setOpenId] = useState<string | null>(null);

  const callNotices = useMemo(() => callNoticesWithMatch(state, now), [state, now]);
  const savedById = new Map(state.savedCallNotices.map((saved) => [saved.callNoticeId, saved]));
  const shown = filteredCallNotices(callNotices, filters, new Set(savedById.keys()), now);
  const open = callNotices.find((callNotice) => callNotice.callNoticeId === openId);

  return (
    <div className="grid gap-8">
      {view === 'matches' ? (
        <MatchSummary locale={locale} creator={state.creator} callNotices={callNotices} />
      ) : (
        <OverviewCounters
          locale={locale}
          callNotices={callNotices}
          savedCount={savedById.size}
          now={now}
        />
      )}
      <p className="rounded-2xl border border-dashed border-muted-foreground p-4 text-small">
        {content.sampleNotice}
      </p>
      <CallNoticeFilters
        locale={locale}
        filters={filters}
        setFilters={setFilters}
        sorts={sorts}
        defaultSort={defaultSort}
        showsClassification={view === 'matches'}
        resultCount={shown.length}
      />
      {shown.length === 0 ? (
        <p className="text-muted-foreground">{content.filters.noResults}</p>
      ) : (
        <ul className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((callNotice, index) => {
            const { callNoticeId } = callNotice;
            const isSaved = savedById.has(callNoticeId);
            return (
              <li key={callNoticeId}>
                <CallNoticeCard
                  locale={locale}
                  callNotice={callNotice}
                  status={callNoticeStatus(callNotice, now)}
                  isNew={isNewCallNotice(callNotice, now)}
                  isSaved={isSaved}
                  index={index}
                  detailsLabel={
                    view === 'matches' ? content.card.details : content.card.checkEligibility
                  }
                  onOpenDetails={() => setOpenId(callNoticeId)}
                  onToggleSaved={() =>
                    setSavedCallNotice(
                      callNoticeId,
                      isSaved
                        ? null
                        : {
                            callNoticeId,
                            remindersOn: false,
                            notifiesByEmail: false,
                            notifiesByWhatsApp: false,
                          },
                    )
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
      {open && (
        <CallNoticeDetails
          locale={locale}
          callNotice={open}
          status={callNoticeStatus(open, now)}
          saved={savedById.get(open.callNoticeId) ?? null}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

export function CallNoticesScreen({ locale, view }: { locale: Locale; view: CallNoticesView }) {
  return (
    <SignedInArea locale={locale} currentPath={VIEW[view].path}>
      {(state) => <CallNotices locale={locale} view={view} state={state} />}
    </SignedInArea>
  );
}
