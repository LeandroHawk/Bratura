import { api } from '@bratura/backend/api';
import type { CallNoticeCard } from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-cards/query';
import {
  savedCallNoticesMax,
  SavedCallNoticeCardsQueryFromBraturaPortalArgsSchema,
  SavedCallNoticeCardsQueryFromBraturaPortalReturnsSchema,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/saved-call-notice-cards/query';
import { useQueries } from 'convex/react';
import { useMemo } from 'react';

/** The ids in the groups one read answers, in order. */
export function savedCallNoticeIdGroups(callNoticeIds: string[]): string[][] {
  return Array.from({ length: Math.ceil(callNoticeIds.length / savedCallNoticesMax) }, (_, group) =>
    callNoticeIds.slice(group * savedCallNoticesMax, (group + 1) * savedCallNoticesMax),
  );
}

/**
 * The cards of the calls the creator saved, in the order saved, one read per
 * `savedCallNoticesMax` ids; `null` while any loads, `'skip'` to not ask at all. An id the contract
 * refuses fails the parse: the store keeps only ids it parsed.
 */
export function useSavedCallNoticeCards(callNoticeIds: string[] | 'skip'): CallNoticeCard[] | null {
  const queries = useMemo(
    () =>
      Object.fromEntries(
        (callNoticeIds === 'skip' ? [] : savedCallNoticeIdGroups(callNoticeIds)).map(
          (group, index) => [
            String(index),
            {
              query: api.matching.savedCallNoticeCards,
              args: SavedCallNoticeCardsQueryFromBraturaPortalArgsSchema.parse({
                callNoticeIds: group,
              }),
            },
          ],
        ),
      ),
    [callNoticeIds],
  );
  const results = useQueries(queries);
  return useMemo(() => {
    if (callNoticeIds === 'skip') return null;
    const groups = Object.keys(queries).map((group) => results[group]);
    if (groups.some((cards) => cards === undefined)) return null;
    return groups.flatMap((cards) => {
      if (cards instanceof Error) throw cards;
      return SavedCallNoticeCardsQueryFromBraturaPortalReturnsSchema.parse(cards);
    });
  }, [callNoticeIds, queries, results]);
}
