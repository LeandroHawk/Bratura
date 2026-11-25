import { z } from 'zod';
import { requiredInstant } from '../../primitives/code/time/instant/fields';
import { MatchClassificationEnum } from '../match/enums/classification/enum';

/** A counter stops here: the screen then shows "500+" instead of reading every row. */
export const callNoticeCounterCeiling = 500;

const counter = z.int().nonnegative().max(callNoticeCounterCeiling);

/**
 * Writes: `matching.ts` only, once per daily recompute. One row: the call screens read it instead
 * of counting hundreds of matches on every visit; it is as fresh as the last recompute.
 */
export const CallNoticeCountersSchema = z.object({
  /** Open calls: a real close still ahead. */
  open: counter,
  closingSoon: counter,
  /** First seen in the last days: the server decides how many. */
  isNew: counter,
  /** Calls not yet closed, by how they fit the profile. */
  byClassification: z.object(
    Object.fromEntries(
      MatchClassificationEnum.options.map((option) => [option, counter]),
    ) as Record<z.infer<typeof MatchClassificationEnum>, typeof counter>,
  ),
  countedAt: requiredInstant,
});
