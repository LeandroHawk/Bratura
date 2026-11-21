import { api } from '@bratura/backend/api';
import {
  CallNoticeCountersQueryFromBraturaPortalReturnsSchema,
  type CallNoticeCounters,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-counters/query';
import { useQuery } from 'convex/react';
import { useMemo } from 'react';

/** How many calls there are, counted by the server; `null` while loading. */
export function useCallNoticeCounters(): CallNoticeCounters | null {
  const counters = useQuery(api.matching.callNoticeCounters, {});
  return useMemo(
    () =>
      counters === undefined
        ? null
        : CallNoticeCountersQueryFromBraturaPortalReturnsSchema.parse(counters),
    [counters],
  );
}
