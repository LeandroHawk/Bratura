import { z } from 'zod';
import { MatchClassificationEnum } from '../../../../match/enums/classification/enum';

/** A counter stops here: the screen then shows "500+" instead of reading every row. */
export const callNoticeCounterCeiling = 500;

const counter = z.int().nonnegative().max(callNoticeCounterCeiling);

export const CallNoticeCountersQueryFromBraturaPortalArgsSchema = z.object({});

/** How many calls for creators there are, counted on the server through the indexes. */
export const CallNoticeCountersQueryFromBraturaPortalReturnsSchema = z.object({
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
});
export type CallNoticeCounters = z.infer<
  typeof CallNoticeCountersQueryFromBraturaPortalReturnsSchema
>;
