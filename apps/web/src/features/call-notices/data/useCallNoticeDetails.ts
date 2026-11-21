import { api } from '@bratura/backend/api';
import type { CallNoticeCard } from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-cards/query';
import {
  CallNoticeDetailsSchema,
  type CallNoticeDetails,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-details/query';
import { useQuery } from 'convex/react';
import { useMemo } from 'react';

/** One call with everything its details show, the fit item by item; `null` while loading. */
export function useCallNoticeDetails(
  callNoticeId: CallNoticeCard['callNoticeId'],
): CallNoticeDetails | null {
  const details = useQuery(api.matching.callNoticeDetails, { callNoticeId });
  return useMemo(
    () => (details === undefined ? null : CallNoticeDetailsSchema.parse(details)),
    [details],
  );
}
