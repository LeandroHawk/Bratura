import { z } from 'zod';

/**
 * Writes: ingestion, when a run ends. Comes from: the run itself. Listed by the source in the run;
 * of those, new to us, and refused by the contract (a broken link, an impossible window).
 */
export const IngestionRunCountsFields = z.object({
  callNoticesSeen: z.int().nonnegative(),
  callNoticesNew: z.int().nonnegative(),
  callNoticesRejected: z.int().nonnegative(),
});

/** A run's counts before it has read anything. */
export const emptyIngestionRunCounts: z.infer<typeof IngestionRunCountsFields> = {
  callNoticesSeen: 0,
  callNoticesNew: 0,
  callNoticesRejected: 0,
};
