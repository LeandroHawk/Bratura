import { SourceKindSchema, SourceSchema } from '@bratura/shared/entities/source/entity';
import { documentId } from '@bratura/shared/primitives/code/id/fields';
import { z } from 'zod';
import { appError } from './lib/appError';
import { internalZodMutation, internalZodQuery } from './lib/builders';

const AddSourceMutationArgsSchema = z.object({ source: SourceSchema });
const AddSourceMutationReturnsSchema = documentId('sources');

/**
 * Registers a source the team has already checked: robots.txt and terms read, days recorded. Run
 * from the dashboard or `convex run`; ingestion never adds a source by itself.
 */
export const addSource = internalZodMutation({
  args: AddSourceMutationArgsSchema,
  returns: AddSourceMutationReturnsSchema,
  handler: async (ctx, { source }) => {
    const existing = await ctx.db
      .query('sources')
      .withIndex('by_slug', (index) => index.eq('slug', source.slug))
      .unique();
    if (existing) throw appError({ code: 'conflict' });
    return await ctx.db.insert('sources', source);
  },
});

const GetSourceQueryArgsSchema = z.object({ sourceId: documentId('sources') });
const GetSourceQueryReturnsSchema = SourceSchema.nullable();

/** A source as the team registered it, for the ingestion that reads it; `null` if the id is gone. */
export const getSource = internalZodQuery({
  args: GetSourceQueryArgsSchema,
  returns: GetSourceQueryReturnsSchema,
  handler: async (ctx, { sourceId }) => await ctx.db.get(sourceId),
});

const ListActiveSourcesQueryArgsSchema = z.object({});
const ListActiveSourcesQueryReturnsSchema = z.array(
  z.object({ sourceId: documentId('sources'), kind: SourceKindSchema }),
);

/** Every active source and its kind, for the daily ingestion. Sources are few: no pagination. */
export const listActiveSources = internalZodQuery({
  args: ListActiveSourcesQueryArgsSchema,
  returns: ListActiveSourcesQueryReturnsSchema,
  handler: async (ctx) => {
    const sources = await ctx.db.query('sources').collect();
    return sources
      .filter((source) => source.isActive)
      .map((source) => ({ sourceId: source._id, kind: source.kind }));
  },
});
