import {
  FailedIngestionRunSchema,
  SucceededIngestionRunSchema,
} from '@bratura/shared/entities/ingestion-run/entity';
import { emptyIngestionRunCounts } from '@bratura/shared/entities/ingestion-run/fragments/counts/fields';
import type { Source, SourceKind } from '@bratura/shared/entities/source/entity';
import { AppErrorSchema } from '@bratura/shared/primitives/code/error/fields';
import { textLengths } from '@bratura/shared/primitives/code/string/fields';
import { ConvexError } from 'convex/values';
import { z } from 'zod';
import { internal } from '../../_generated/api';
import type { Id } from '../../_generated/dataModel';
import type { ActionCtx } from '../../_generated/server';
import type { CallNoticeListingToRecord } from '../../callNotices';

/** What one source's ingestion ended as: its run's final status, or `skipped` (no run opened). */
export const IngestionOutcomeEnum = z.enum([
  'skipped',
  SucceededIngestionRunSchema.shape.status.value,
  FailedIngestionRunSchema.shape.status.value,
]);
export type IngestionOutcome = z.infer<typeof IngestionOutcomeEnum>;

/**
 * What a source kind brings to ingestion; the rest (lease, counts, refusals, failure) is shared.
 * `fetchEntries` throws when the source does not answer: that fails the run.
 */
export type SourceReader<Kind extends SourceKind, Entry> = {
  fetchEntries: (source: Extract<Source, { kind: Kind }>) => Promise<unknown[]>;
  EntrySchema: z.ZodType<Entry>;
  listingFromEntry: (sourceId: Id<'sources'>, entry: Entry) => CallNoticeListingToRecord;
};

function isInvalidInput(error: unknown) {
  return (
    error instanceof ConvexError &&
    AppErrorSchema.safeParse(error.data).data?.code === 'invalidInput'
  );
}

/**
 * Reads one source and records every call notice it lists. Skipped when the source is inactive,
 * of another kind, or already being read (lease). An entry refused at the edge or by the contract
 * is counted and logged, and the run goes on.
 */
export async function runSourceIngestion<Kind extends SourceKind, Entry>(
  ctx: ActionCtx,
  sourceId: Id<'sources'>,
  kind: Kind,
  reader: SourceReader<Kind, Entry>,
): Promise<IngestionOutcome> {
  // Return types are written out in this module: it calls functions through `internal`, and
  // without them TypeScript gives up on the whole generated API (`any` everywhere).
  const source: Source | null = await ctx.runQuery(internal.sources.getSource, {
    sourceId,
  });
  if (source?.kind !== kind || !source.isActive) return 'skipped';
  const runId: Id<'ingestionRuns'> | null = await ctx.runMutation(
    internal.ingestion.startIngestionRun,
    { sourceId },
  );
  if (!runId) return 'skipped';

  const counts = { ...emptyIngestionRunCounts };
  try {
    const entries = await reader.fetchEntries(source as Extract<Source, { kind: Kind }>);
    for (const raw of entries) {
      counts.callNoticesSeen += 1;
      const entry = reader.EntrySchema.safeParse(raw);
      if (!entry.success) {
        counts.callNoticesRejected += 1;
        console.warn('Entry refused at the edge', entry.error.issues);
        continue;
      }
      try {
        const { isNew }: { isNew: boolean } = await ctx.runMutation(
          internal.callNotices.recordCallNotice,
          reader.listingFromEntry(sourceId, entry.data),
        );
        if (isNew) counts.callNoticesNew += 1;
      } catch (error) {
        if (!isInvalidInput(error)) throw error;
        counts.callNoticesRejected += 1;
        console.warn('Entry refused by the contract', error);
      }
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    await ctx.runMutation(internal.ingestion.failIngestionRun, {
      runId,
      ...counts,
      failureReason: reason.slice(0, textLengths.max) || 'Unknown failure',
    });
    return 'failed';
  }
  await ctx.runMutation(internal.ingestion.finishIngestionRun, {
    runId,
    ...counts,
  });
  return 'succeeded';
}
