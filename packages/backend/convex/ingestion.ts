import {
  FailedIngestionRunSchema,
  SucceededIngestionRunSchema,
} from '@bratura/shared/entities/ingestion-run/entity';
import {
  emptyIngestionRunCounts,
  IngestionRunCountsFields,
} from '@bratura/shared/entities/ingestion-run/fragments/counts/fields';
import type { SourceKind } from '@bratura/shared/entities/source/entity';
import { documentId } from '@bratura/shared/primitives/code/id/fields';
import type { FunctionReference } from 'convex/server';
import { z } from 'zod';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';
import { appError } from './lib/appError';
import { internalZodAction, internalZodMutation } from './lib/builders';
import {
  IngestionOutcomeEnum,
  runSourceIngestion,
  type IngestionOutcome,
} from './model/ingestion/runSourceIngestion';
import { fetchOpenMapasOpportunities } from './model/mapasCulturais/client';
import { callNoticeListingFromMapasOpportunity } from './model/mapasCulturais/listing';
import { MapasOpportunitySchema } from './model/mapasCulturais/payload';

// Return types are written out in this module: it calls its own functions through `internal`, and
// without them TypeScript gives up on the whole generated API (`any` everywhere).

// The daily run ------------------------------------------------------------------------------

type IngestSourceAction = FunctionReference<'action', 'internal', { sourceId: Id<'sources'> }>;

/**
 * The action that reads each kind, or `null` while a kind has no reader yet. A new kind fails `tsc`
 * here until it is mapped, so the daily run cannot forget it.
 */
const ingestActionByKind: Record<SourceKind, IngestSourceAction | null> = {
  mapasCulturaisInstance: internal.ingestion.ingestMapasCulturaisInstance,
  officialPage: null,
  newsSite: null,
};

const ScheduleDailyIngestionActionArgsSchema = z.object({});
const ScheduleDailyIngestionActionReturnsSchema = z.int().nonnegative();

/**
 * The cron's entry: schedules one ingestion per active source with a reader, each its own action
 * and run, and reads nothing itself. Returns how many it scheduled.
 */
export const scheduleDailyIngestion = internalZodAction({
  args: ScheduleDailyIngestionActionArgsSchema,
  returns: ScheduleDailyIngestionActionReturnsSchema,
  handler: async (ctx): Promise<number> => {
    const sources: { sourceId: Id<'sources'>; kind: SourceKind }[] = await ctx.runQuery(
      internal.sources.listActiveSources,
      {},
    );
    let scheduled = 0;
    for (const { sourceId, kind } of sources) {
      const action = ingestActionByKind[kind];
      if (!action) continue;
      await ctx.scheduler.runAfter(0, action, { sourceId });
      scheduled += 1;
    }
    return scheduled;
  },
});

// One action per source kind -----------------------------------------------------------------

const IngestMapasCulturaisInstanceActionArgsSchema = z.object({ sourceId: documentId('sources') });
const IngestMapasCulturaisInstanceActionReturnsSchema = IngestionOutcomeEnum;

/** Reads one Mapas Culturais instance: its open opportunities, through its public JSON API. */
export const ingestMapasCulturaisInstance = internalZodAction({
  args: IngestMapasCulturaisInstanceActionArgsSchema,
  returns: IngestMapasCulturaisInstanceActionReturnsSchema,
  handler: async (ctx, { sourceId }): Promise<IngestionOutcome> =>
    await runSourceIngestion(ctx, sourceId, 'mapasCulturaisInstance', {
      fetchEntries: async (source) => await fetchOpenMapasOpportunities(source.baseUrl, Date.now()),
      EntrySchema: MapasOpportunitySchema,
      listingFromEntry: callNoticeListingFromMapasOpportunity,
    }),
});

// The run of one source: lease and counts (the `ingestionRuns` table's only writer) ----------

/** A run older than this is taken as dead (its action stopped) and may be replaced. */
export const ingestionRunLeaseMs = 30 * 60 * 1000;

const StartIngestionRunMutationArgsSchema = z.object({ sourceId: documentId('sources') });
const StartIngestionRunMutationReturnsSchema = documentId('ingestionRuns').nullable();

/**
 * Opens a run for a source, unless one is already running (the lease pattern): returns `null` then,
 * and the caller skips. A run past `ingestionRunLeaseMs` is closed as failed and replaced.
 */
export const startIngestionRun = internalZodMutation({
  args: StartIngestionRunMutationArgsSchema,
  returns: StartIngestionRunMutationReturnsSchema,
  handler: async (ctx, { sourceId }) => {
    const now = Date.now();
    const running = await ctx.db
      .query('ingestionRuns')
      .withIndex('by_source_and_status', (index) =>
        index.eq('sourceId', sourceId).eq('status', 'running'),
      )
      .collect();
    if (running.some((run) => now - run.startedAt < ingestionRunLeaseMs)) return null;
    for (const stale of running) {
      await ctx.db.replace(stale._id, {
        sourceId: stale.sourceId,
        startedAt: stale.startedAt,
        ...IngestionRunCountsFields.parse(stale),
        status: 'failed',
        finishedAt: now,
        failureReason: 'Stale: no end recorded within the lease.',
      });
    }
    return await ctx.db.insert('ingestionRuns', {
      sourceId,
      startedAt: now,
      status: 'running',
      ...emptyIngestionRunCounts,
    });
  },
});

async function runningRun(ctx: MutationCtx, runId: Id<'ingestionRuns'>) {
  const run = await ctx.db.get(runId);
  if (run?.status !== 'running') throw appError({ code: 'conflict' });
  return run;
}

const FinishIngestionRunMutationArgsSchema = IngestionRunCountsFields.extend({
  runId: documentId('ingestionRuns'),
});
const FinishIngestionRunMutationReturnsSchema = z.null();

/** Closes a running run as succeeded, with what it counted. */
export const finishIngestionRun = internalZodMutation({
  args: FinishIngestionRunMutationArgsSchema,
  returns: FinishIngestionRunMutationReturnsSchema,
  handler: async (ctx, { runId, ...counts }) => {
    const { sourceId, startedAt } = await runningRun(ctx, runId);
    await ctx.db.replace(runId, {
      sourceId,
      startedAt,
      ...counts,
      status: SucceededIngestionRunSchema.shape.status.value,
      finishedAt: Date.now(),
    });
    return null;
  },
});

const FailIngestionRunMutationArgsSchema = FinishIngestionRunMutationArgsSchema.extend(
  FailedIngestionRunSchema.pick({ failureReason: true }).shape,
);
const FailIngestionRunMutationReturnsSchema = z.null();

/** Closes a running run as failed: what it counted until then, and why it stopped. */
export const failIngestionRun = internalZodMutation({
  args: FailIngestionRunMutationArgsSchema,
  returns: FailIngestionRunMutationReturnsSchema,
  handler: async (ctx, { runId, failureReason, ...counts }) => {
    const { sourceId, startedAt } = await runningRun(ctx, runId);
    await ctx.db.replace(runId, {
      sourceId,
      startedAt,
      ...counts,
      status: FailedIngestionRunSchema.shape.status.value,
      finishedAt: Date.now(),
      failureReason,
    });
    return null;
  },
});
