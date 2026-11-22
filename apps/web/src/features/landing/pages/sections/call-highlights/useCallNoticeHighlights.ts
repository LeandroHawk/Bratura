import { api } from '@bratura/backend/api';
import { CallNoticeHighlightsQueryFromBraturaPortalReturnsSchema } from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-highlights/query';
import { useQuery } from 'convex/react';
import { useMemo } from 'react';

export function useCallNoticeHighlights() {
  const highlights = useQuery(api.matching.callNoticeHighlights, {});
  return useMemo(
    () =>
      highlights === undefined
        ? null
        : CallNoticeHighlightsQueryFromBraturaPortalReturnsSchema.parse(highlights),
    [highlights],
  );
}
