import { api } from '@bratura/backend/api';
import {
  callNoticeCardsPageMax,
  CallNoticeCardSchema,
  type CallNoticeCard,
  type CallNoticeCloseFilter,
  type CallNoticeSort,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-cards/query';
import type { MatchClassification } from '@bratura/shared/entities/match/enums/classification/enum';
import { usePaginatedQuery } from 'convex/react';
import { useMemo } from 'react';

export type CallNoticeCardsFilter = {
  classification: MatchClassification | null;
  closes: CallNoticeCloseFilter;
  sort: CallNoticeSort;
};

const CardsSchema = CallNoticeCardSchema.array();

/**
 * The calls for creators the server keeps for a filter, a page at a time, parsed by the contract.
 * `callNotices` is `null` while the first page loads, and with `'skip'` (nothing is asked).
 */
export function useCallNoticeCards(filter: CallNoticeCardsFilter | 'skip'): {
  callNotices: CallNoticeCard[] | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
} {
  const { results, status, loadMore } = usePaginatedQuery(api.matching.callNoticeCards, filter, {
    initialNumItems: callNoticeCardsPageMax,
  });
  const callNotices = useMemo(
    () => (status === 'LoadingFirstPage' ? null : CardsSchema.parse(results)),
    [results, status],
  );
  return {
    callNotices,
    hasMore: status === 'CanLoadMore',
    isLoadingMore: status === 'LoadingMore',
    loadMore: () => loadMore(callNoticeCardsPageMax),
  };
}
