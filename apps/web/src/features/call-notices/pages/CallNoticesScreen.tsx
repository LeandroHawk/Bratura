'use client';

import type { CallNoticeCard as CallNoticeCardData } from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-cards/query';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Button } from '@bratura/ui';
import { useMemo, useState } from 'react';
import { useCallNoticeCards } from '@/features/call-notices/data/useCallNoticeCards';
import { useCallNoticeCounters } from '@/features/call-notices/data/useCallNoticeCounters';
import { useSavedCallNoticeCards } from '@/features/call-notices/data/useSavedCallNoticeCards';
import { SignedInArea, type SignedInState } from '@/features/common/components/app/SignedInArea';
import { BackendData } from '@/features/common/components/BackendData';
import { ROUTES } from '@/features/common/config/routes';
import { setSavedCallNotice } from '@/features/common/data/demoStore';
import { CallNoticeCard } from './sections/common/CallNoticeCard';
import { CallNoticeDetails } from './sections/common/CallNoticeDetails';
import {
  CallNoticeFilters,
  type CallNoticeFilterValues,
} from './sections/common/CallNoticeFilters';
import { CALL_NOTICES_CONTENT } from './sections/common/content';
import { MatchSummary } from './sections/match-summary/MatchSummary';
import { OverviewCounters } from './sections/overview-counters/OverviewCounters';

/** The two screens over the same calls: the fit with the portfolio first, or every call. */
export type CallNoticesView = 'matches' | 'overview';

const VIEW: Record<
  CallNoticesView,
  { path: typeof ROUTES.matches | typeof ROUTES.callNotices; filters: CallNoticeFilterValues }
> = {
  // A closed call is never one "for you": the fit opens on what can still be applied to.
  matches: {
    path: ROUTES.matches,
    filters: {
      classification: null,
      closes: 'stillOpen',
      sort: 'closestDeadline',
      onlySaved: false,
    },
  },
  overview: {
    path: ROUTES.callNotices,
    filters: { classification: null, closes: 'stillOpen', sort: 'newest', onlySaved: false },
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
  const defaultFilters = VIEW[view].filters;
  const [filters, setFilters] = useState(defaultFilters);
  const [open, setOpen] = useState<CallNoticeCardData | null>(null);

  const savedById = new Map(state.savedCallNotices.map((saved) => [saved.callNoticeId, saved]));
  const savedIds = useMemo(
    () => state.savedCallNotices.map((saved) => saved.callNoticeId),
    [state.savedCallNotices],
  );
  const { onlySaved, ...serverFilter } = filters;
  const counters = useCallNoticeCounters();
  const page = useCallNoticeCards(onlySaved ? 'skip' : serverFilter);
  const savedCards = useSavedCallNoticeCards(onlySaved ? savedIds : 'skip');
  const shown = onlySaved ? savedCards : page.callNotices;
  const hasMore = !onlySaved && page.hasMore;

  return (
    <div className="grid gap-8">
      {view === 'matches' ? (
        <MatchSummary locale={locale} counters={counters} />
      ) : (
        <OverviewCounters locale={locale} counters={counters} savedCount={savedById.size} />
      )}
      <p className="rounded-2xl border border-dashed border-muted-foreground p-4 text-small">
        {content.fictionalProfileNotice}
      </p>
      <CallNoticeFilters
        locale={locale}
        filters={filters}
        setFilters={setFilters}
        defaultFilters={defaultFilters}
        shownCount={shown?.length ?? null}
        hasMore={hasMore}
      />
      {shown?.length === 0 && <p className="text-muted-foreground">{content.filters.noResults}</p>}
      {shown !== null && shown.length > 0 && (
        <ul className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((callNotice, index) => {
            const { callNoticeId } = callNotice;
            const isSaved = savedById.has(callNoticeId);
            return (
              <li key={callNoticeId}>
                <CallNoticeCard
                  locale={locale}
                  callNotice={callNotice}
                  isSaved={isSaved}
                  index={index}
                  detailsLabel={
                    view === 'matches' ? content.card.details : content.card.checkEligibility
                  }
                  onOpenDetails={() => setOpen(callNotice)}
                  onToggleSaved={() =>
                    setSavedCallNotice(
                      callNoticeId,
                      isSaved ? null : { callNoticeId, remindersOn: false },
                    )
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
      {hasMore && (
        <div>
          <Button variant="ghost" onClick={page.loadMore}>
            {content.filters.loadMore}
          </Button>
        </div>
      )}
      {page.isLoadingMore && <p role="status">{content.filters.loadingMore}</p>}
      {open && (
        <CallNoticeDetails
          locale={locale}
          callNotice={open}
          saved={savedById.get(open.callNoticeId) ?? null}
          onSavedChange={(saved) =>
            setSavedCallNotice(
              open.callNoticeId,
              saved && { callNoticeId: open.callNoticeId, ...saved },
            )
          }
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

export function CallNoticesScreen({ locale, view }: { locale: Locale; view: CallNoticesView }) {
  return (
    <SignedInArea locale={locale} currentPath={VIEW[view].path}>
      {(state) => (
        <BackendData unavailable={<p role="status">{CALL_NOTICES_CONTENT[locale].unavailable}</p>}>
          <CallNotices locale={locale} view={view} state={state} />
        </BackendData>
      )}
    </SignedInArea>
  );
}
