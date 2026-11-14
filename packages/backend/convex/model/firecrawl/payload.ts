import { z } from 'zod';

/** A `POST /v2/scrape` answer, with only what we read: the page or PDF as Markdown. */
export const FirecrawlScrapeResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ markdown: z.string() }),
});
