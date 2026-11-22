import { z } from 'zod';
import { documentId } from '../../primitives/code/id/fields';
import { requiredInstant } from '../../primitives/code/time/instant/fields';
import { requiredAmountInCents } from '../../primitives/domain/money/fields';
import { MatchClassificationEnum } from './enums/classification/enum';

/**
 * `closesAtForOrdering` of a call whose source gives no close: after every real one, so one index
 * range answers "still open, closing first".
 */
export const matchClosesAtWithoutClose = Number.MAX_SAFE_INTEGER;

/**
 * `closesAtForOrdering` of a call whose source posted a result and prints no past close: before
 * every real one, so the same index lists it as closed, after the calls with a known close.
 */
export const matchClosesAtWithResultPosted = 0;

/**
 * Writes: `matching.ts` only, from the call's extraction and the profile. One row per call for
 * creators: there is one profile until `creators` exists (the fictional creator), then a row per
 * creator and call. Light on purpose: the lists and counters read many rows; the itemized checks
 * are computed for one call at a time.
 */
export const MatchSchema = z.object({
  callNoticeId: documentId('callNotices'),
  /** Without the deadline: a reader demotes a closed call (`matchClassificationOnDeadline`). */
  classification: MatchClassificationEnum,
  /** The call's close, or `matchClosesAtWithoutClose`; copied from the call for the indexes. */
  closesAtForOrdering: requiredInstant,
  /** The largest amount one project gets; never the call's total budget. */
  largestAmountPerProjectInCents: requiredAmountInCents.nullable(),
  /** The call's `firstSeenAt`, copied for the "newest" index. */
  callNoticeFirstSeenAt: requiredInstant,
  computedAt: requiredInstant,
});

export type Match = z.infer<typeof MatchSchema>;
