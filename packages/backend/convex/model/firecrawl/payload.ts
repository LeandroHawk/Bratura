import { z } from 'zod';

/** What every `POST /v2/scrape` answer says about the read; Firecrawl may leave any field out. */
const FirecrawlScrapeMetadataSchema = z.object({
  creditsUsed: z.int().nonnegative().optional(),
});

/**
 * A `POST /v2/scrape` answer, with only what we read: the page or PDF as Markdown, and its cost.
 */
export const FirecrawlScrapeResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    markdown: z.string(),
    metadata: FirecrawlScrapeMetadataSchema.optional(),
  }),
});

/**
 * A `POST /v2/scrape` answer for `rawHtml`: the body as the site sent it (HTML, or JSON from an
 * API), and how the site answered.
 */
export const FirecrawlRawHtmlResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    rawHtml: z.string(),
    metadata: FirecrawlScrapeMetadataSchema.extend({
      url: z.string().optional(),
      sourceURL: z.string().optional(),
      statusCode: z.int().optional(),
      contentType: z.string().optional(),
    }).optional(),
  }),
});
