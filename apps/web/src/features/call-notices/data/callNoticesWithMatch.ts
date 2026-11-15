import type { CallNoticeWithMatch } from '@bratura/shared/entities/call-notice/dto/bratura-portal/eligible-call-notices/query';
import type { SignedInState } from '@/features/common/components/app/SignedInArea';
import { sampleCallNotices } from './sampleCallNotices';
import { standInMatch } from './standInMatching';

/**
 * Every call with its fit for the signed-in creator: the one read both call screens draw from.
 * The swap point for Convex's `eligibleCallNotices` query, which returns this same shape.
 */
export function callNoticesWithMatch(
  { creator, portfolioItems }: Pick<SignedInState, 'creator' | 'portfolioItems'>,
  now: number,
): CallNoticeWithMatch[] {
  return sampleCallNotices(now).map((callNotice) => ({
    ...callNotice,
    match: standInMatch(callNotice, creator, portfolioItems, now),
  }));
}
