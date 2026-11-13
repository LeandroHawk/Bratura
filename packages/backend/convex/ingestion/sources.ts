import { z } from 'zod';
import { SourceSchema } from '@bratura/shared/entities/source/entity';
import { documentId } from '@bratura/shared/primitives/code/id/fields';
import { appError } from '../appError';
import { internalZodMutation } from '../builders';

/**
 * Registers a source the team has already checked: robots.txt and terms read, days recorded. Run
 * from the dashboard or `convex run`; ingestion never adds a source by itself.
 */
export const addSource = internalZodMutation({
  args: z.object({ source: SourceSchema }),
  returns: documentId('sources'),
  handler: async (ctx, { source }) => {
    const existing = await ctx.db
      .query('sources')
      .withIndex('by_slug', (index) => index.eq('slug', source.slug))
      .unique();
    if (existing) throw appError({ code: 'conflict' });
    return await ctx.db.insert('sources', source);
  },
});
