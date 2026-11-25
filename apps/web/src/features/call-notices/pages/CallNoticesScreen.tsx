'use client';

import type { CallNoticeCard as CallNoticeCardData } from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-cards/query';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { useMemo, useState } from 'react';
import { useCallNoticeCards } from '@/features/call-notices/data/useCallNoticeCards';
import { useCallNoticeCounters } from '@/features/call-notices/data/useCallNoticeCounters';
import { useSavedCallNoticeCards } from '@/features/call-notices/data/useSavedCallNoticeCards';
import { SignedInArea, type SignedInState } from '@/features/common/components/app/SignedInArea';
import { BackendData } from '@/features/common/components/BackendData';
import { RoomUnderRestoration } from '@/features/common/components/restoration/RoomUnderRestoration';
import { ROUTES } from '@/features/common/config/routes';
import { setSavedCallNotice } from '@/features/common/data/demoStore';
import { CALL_NOTICES_SCREEN_CONTENT } from './content';
import { CallNoticeBoard } from './sections/board/CallNoticeBoard';
import { CallNoticeDetails } from './sections/details/CallNoticeDetails';
import {
  CallNoticeFilters,
  type CallNoticeFilterValues,
} from './sections/filters/CallNoticeFilters';
import { MatchSummary } from './sections/match-summary/MatchSummary';
import { OverviewCounters } from './sections/overview-counters/OverviewCounters';

/** The two screens over the same calls: the fit with the portfolio first, or every call. */
export type CallNoticesView = 'matches' | 'overview';

const VIEW: Record<
  CallNoticesView,
  { path: typeof ROUTES.matches | typeof ROUTES.callNotices; filters: CallNoticeFilterValues }
> = {
  // A closed call is never one "for you": the fit opens on what can still be applied to, the
  // eligible calls first.
  matches: {
    path: ROUTES.matches,
    filters: {
      classification: null,
      closes: 'stillOpen',
      sort: 'bestFit',
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
  const content = CALL_NOTICES_SCREEN_CONTENT[locale];
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
      <CallNoticeBoard
        locale={locale}
        callNotices={shown}
        savedById={savedById}
        asksEligibility={view === 'overview'}
        loadMore={hasMore ? page.loadMore : null}
        isLoadingMore={page.isLoadingMore}
        onOpenDetails={setOpen}
        onToggleSaved={({ callNoticeId }, isSaved) =>
          setSavedCallNotice(callNoticeId, isSaved ? null : { callNoticeId, remindersOn: false })
        }
      />
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
        <BackendData
          unavailable={
            <RoomUnderRestoration
              locale={locale}
              message={CALL_NOTICES_SCREEN_CONTENT[locale].unavailable}
            />
          }
          failed={(retry) => (
            <RoomUnderRestoration
              locale={locale}
              message={CALL_NOTICES_SCREEN_CONTENT[locale].failed}
              retry={retry}
            />
          )}
        >
          <CallNotices locale={locale} view={view} state={state} />
        </BackendData>
      )}
    </SignedInArea>
  );
}
