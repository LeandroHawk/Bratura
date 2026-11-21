import { api } from '@bratura/backend/api';
import type { CallNoticeCard } from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-cards/query';
import {
  SavedCallNoticeCardsQueryFromBraturaPortalArgsSchema,
  SavedCallNoticeCardsQueryFromBraturaPortalReturnsSchema,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/saved-call-notice-cards/query';
import { useQuery } from 'convex/react';
import { useMemo } from 'react';

/**
 * The cards of the calls the creator saved; `null` while loading, `'skip'` to not ask at all. A
 * list the contract refuses (too long) asks for none.
 */
export function useSavedCallNoticeCards(callNoticeIds: string[] | 'skip'): CallNoticeCard[] | null {
  const args = useMemo(() => {
    if (callNoticeIds === 'skip') return 'skip' as const;
    const parsed = SavedCallNoticeCardsQueryFromBraturaPortalArgsSchema.safeParse({
      callNoticeIds,
    });
    return parsed.success ? parsed.data : { callNoticeIds: [] };
  }, [callNoticeIds]);
  const cards = useQuery(api.matching.savedCallNoticeCards, args);
  return useMemo(
    () =>
      cards === undefined
        ? null
        : SavedCallNoticeCardsQueryFromBraturaPortalReturnsSchema.parse(cards),
    [cards],
  );
}
