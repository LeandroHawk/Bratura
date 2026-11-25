import { SourceKindSchema, SourceSchema } from '@bratura/shared/entities/source/entity';
import { SourceIdentityFields } from '@bratura/shared/entities/source/fragments/identity/fields';
import { documentId } from '@bratura/shared/primitives/code/id/fields';
import { z } from 'zod';
import { appError } from './lib/appError';
import { internalZodMutation, internalZodQuery } from './lib/builders';
import { registeredSources } from './model/sources/registry';

const RegisterSourceMutationArgsSchema = z.object({ slug: SourceIdentityFields.shape.slug });
const RegisterSourceMutationReturnsSchema = documentId('sources');

/**
 * Copies one source from `model/sources/registry.ts` into the table: inserts it the first time,
 * replaces the row afterwards (same id, so its call notices stay linked). Run after the registry
 * changes, `convex run sources:registerSource '{"slug":"…"}'`; ingestion never adds a source.
 */
export const registerSource = internalZodMutation({
  args: RegisterSourceMutationArgsSchema,
  returns: RegisterSourceMutationReturnsSchema,
  handler: async (ctx, { slug }) => {
    const registered = registeredSources.find((source) => source.slug === slug);
    if (!registered) throw appError({ code: 'notFound' });
    const existing = await ctx.db
      .query('sources')
      .withIndex('by_slug', (index) => index.eq('slug', slug))
      .unique();
    if (!existing) return await ctx.db.insert('sources', registered);
    await ctx.db.replace(existing._id, registered);
    return existing._id;
  },
});

const GetSourceQueryArgsSchema = z.object({ sourceId: documentId('sources') });
const GetSourceQueryReturnsSchema = SourceSchema.nullable();

/**
 * A source as the team registered it, for the ingestion that reads it; `null` if the id is gone.
 */
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
    const sources = await ctx.db
      .query('sources')
      .withIndex('by_is_active', (index) => index.eq('isActive', true))
      .collect();
    return sources.map((source) => ({ sourceId: source._id, kind: source.kind }));
  },
});
