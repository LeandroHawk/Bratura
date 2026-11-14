import { z } from 'zod';

/** A `POST /v2/scrape` answer, with only what we read: the page or PDF as Markdown, and its cost. */
export const FirecrawlScrapeResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    markdown: z.string(),
    metadata: z.object({ creditsUsed: z.int().nonnegative().optional() }).optional(),
  }),
});
