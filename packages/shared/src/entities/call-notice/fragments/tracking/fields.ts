import { z } from 'zod';
import { requiredInstant } from '../../../../primitives/code/time/instant/fields';

/**
 * Writes: the server, inside `recordCallNotice` (refused from a caller). Comes from: the clock.
 * When ingestion first and last found the notice; one no longer listed keeps its last `lastSeenAt`.
 */
export const CallNoticeTrackingFields = z.object({
  firstSeenAt: requiredInstant,
  lastSeenAt: requiredInstant,
  /** Closed when first found (its close already past, or a result posted): kept out of the read
   * queue's index. Written on every record; absent only on rows from before it, until
   * `callNotices:backfillClosedWhenFirstSeen` runs. */
  closedWhenFirstSeen: z.boolean().optional(),
});
