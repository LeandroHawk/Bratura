import { z } from 'zod';

/**
 * A `POST /v2/scrape` answer, with only what we read: the page or PDF as Markdown, and its cost.
 */
export const FirecrawlScrapeResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    markdown: z.string(),
    metadata: z.object({ creditsUsed: z.int().nonnegative().optional() }).optional(),
  }),
});

/**
 * A `POST /v2/scrape` answer for `rawHtml`: the body as the site sent it (HTML, or JSON from an
 * API), and what the site answered. Firecrawl may leave out any metadata field.
 */
export const FirecrawlRawHtmlResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    rawHtml: z.string(),
    metadata: z
      .object({
        url: z.string().optional(),
        sourceURL: z.string().optional(),
        statusCode: z.int().optional(),
        contentType: z.string().optional(),
        creditsUsed: z.int().nonnegative().optional(),
      })
      .optional(),
  }),
});
