import { z } from 'zod';
import { documentId } from '../../primitives/code/id/fields';
import { requiredString } from '../../primitives/code/string/fields';
import { requiredInstant } from '../../primitives/code/time/instant/fields';

const ingestionRunCommonFields = {
  sourceId: documentId('sources'),
  startedAt: requiredInstant,
  /** Call notices the source listed in this run, and how many of them were not stored before. */
  callNoticesSeen: z.int().nonnegative(),
  callNoticesNew: z.int().nonnegative(),
};

/**
 * Writes: ingestion, one row per pass over a source. Reads: the admin review (later). A failed run
 * says why: HTTP 402 when Firecrawl credits run out, a robots block, a source that did not answer.
 */
export const IngestionRunSchema = z.discriminatedUnion('status', [
  z.object({ ...ingestionRunCommonFields, status: z.literal('running') }),
  z.object({
    ...ingestionRunCommonFields,
    status: z.literal('succeeded'),
    finishedAt: requiredInstant,
  }),
  z.object({
    ...ingestionRunCommonFields,
    status: z.literal('failed'),
    finishedAt: requiredInstant,
    failureReason: requiredString('max'),
  }),
]);

export type IngestionRun = z.infer<typeof IngestionRunSchema>;
