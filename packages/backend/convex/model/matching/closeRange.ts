import type { CallNoticeCloseFilter } from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-cards/query';
import type { CallNotice } from '@bratura/shared/entities/call-notice/entity';
import {
  callNoticeDeadline,
  type CallNoticeDeadline,
} from '@bratura/shared/entities/call-notice/fragments/registration-window/fields';
import {
  matchClosesAtWithoutClose,
  matchClosesAtWithResultPosted,
} from '@bratura/shared/entities/match/entity';

const dayInMs = 24 * 60 * 60 * 1000;

/**
 * The step a list's bounds move in. A page's cursor only continues a query with the same bounds:
 * read straight from the clock, they change every millisecond and Convex refuses "load more".
 */
export const closeRangeStepInMs = 60 * 60 * 1000;

const closesWithinDays: Partial<Record<CallNoticeCloseFilter, number>> = {
  within7Days: 7,
  within30Days: 30,
};

/**
 * The range of `closesAtForOrdering` that holds every call of a close filter, widened to the step
 * `now` is in. `isInCloseFilter` then keeps the exact ones.
 */
export function closeRange({ closes, now }: { closes: CallNoticeCloseFilter; now: number }) {
  const stepStart = now - (now % closeRangeStepInMs);
  const stepEnd = stepStart + closeRangeStepInMs;
  if (closes === 'closed') return { from: 0, to: stepEnd };
  const days = closesWithinDays[closes];
  return {
    from: stepStart,
    to: days === undefined ? matchClosesAtWithoutClose : stepEnd + days * dayInMs,
  };
}

/** Whether a call closing at `closesAt` belongs to the close filter at this very instant. */
export function isInCloseFilter({
  closes,
  closesAt,
  now,
}: {
  closes: CallNoticeCloseFilter;
  closesAt: number;
  now: number;
}) {
  if (closes === 'closed') return closesAt < now;
  const days = closesWithinDays[closes];
  return closesAt >= now && (days === undefined || closesAt <= now + days * dayInMs);
}

type ClosingForCreators = Pick<CallNotice, 'registrationCloses' | 'resultPosted'>;

/** A call's deadline as a creator reads it: a posted result closes it, with or without a close. */
export function deadlineForCreators(
  callNotice: ClosingForCreators,
  now: number,
): CallNoticeDeadline {
  return callNotice.resultPosted === true ? 'closed' : callNoticeDeadline(callNotice, now);
}

/** A match's `closesAtForOrdering`: in the past whenever `deadlineForCreators` reads `closed`. */
export function closesAtForOrdering(
  { registrationCloses, resultPosted }: ClosingForCreators,
  now: number,
) {
  if (resultPosted !== true) return registrationCloses?.at ?? matchClosesAtWithoutClose;
  return registrationCloses !== null && registrationCloses.at < now
    ? registrationCloses.at
    : matchClosesAtWithResultPosted;
}
