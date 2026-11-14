import { z } from 'zod';
import { documentId } from '../../primitives/code/id/fields';
import { requiredString } from '../../primitives/code/string/fields';
import { requiredInstant } from '../../primitives/code/time/instant/fields';
import { IngestionRunCountsFields } from './fragments/counts/fields';

const ingestionRunCommonFields = {
  sourceId: documentId('sources'),
  startedAt: requiredInstant,
  ...IngestionRunCountsFields.shape,
};

const RunningIngestionRunSchema = z.object({
  ...ingestionRunCommonFields,
  status: z.literal('running'),
});

export const SucceededIngestionRunSchema = z.object({
  ...ingestionRunCommonFields,
  status: z.literal('succeeded'),
  finishedAt: requiredInstant,
});

export const FailedIngestionRunSchema = z.object({
  ...ingestionRunCommonFields,
  status: z.literal('failed'),
  finishedAt: requiredInstant,
  failureReason: requiredString('max'),
});

/**
 * Writes: ingestion, one row per pass over a source; at most one `running` per source (a lease).
 * Reads: the admin review (later). A failed run says why.
 */
export const IngestionRunSchema = z.discriminatedUnion('status', [
  RunningIngestionRunSchema,
  SucceededIngestionRunSchema,
  FailedIngestionRunSchema,
]);

export type IngestionRun = z.infer<typeof IngestionRunSchema>;
