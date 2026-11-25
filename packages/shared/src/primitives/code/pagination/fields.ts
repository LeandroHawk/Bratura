import { z } from 'zod';

/**
 * What Convex's `usePaginatedQuery` sends for one page, with our ceiling on its size: a caller
 * cannot ask for a whole table in one page.
 */
export function paginationOptions(pageSizeMax: number) {
  return z.object({
    numItems: z.int().min(1).max(pageSizeMax),
    cursor: z.string().nullable(),
    endCursor: z.string().nullable().optional(),
    id: z.number().optional(),
  });
}

/** One page as Convex's `paginate` returns it. */
export function paginatedPage<Item extends z.ZodType>(item: Item) {
  return z.object({
    page: z.array(item),
    isDone: z.boolean(),
    continueCursor: z.string(),
    splitCursor: z.string().nullable().optional(),
    pageStatus: z.enum(['SplitRecommended', 'SplitRequired']).nullable().optional(),
  });
}
