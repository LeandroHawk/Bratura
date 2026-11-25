import { z } from 'zod';
import { CallNoticeCountersSchema } from '../../../../call-notice-counters/entity';

export const CallNoticeCountersQueryFromBraturaPortalArgsSchema = z.object({});

/** How many calls for creators there are, as the last daily recompute counted them. */
export const CallNoticeCountersQueryFromBraturaPortalReturnsSchema = CallNoticeCountersSchema.omit({
  countedAt: true,
});
export type CallNoticeCounters = z.infer<
  typeof CallNoticeCountersQueryFromBraturaPortalReturnsSchema
>;
