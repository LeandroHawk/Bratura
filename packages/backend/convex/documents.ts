import { CallNoticeDocumentUrlSchema } from '@bratura/shared/entities/call-notice/fragments/listing/fields';
import { z } from 'zod';
import { internalZodAction } from './lib/builders';
import { requiredEnv } from './lib/env';
import { scrapeMarkdown } from './model/firecrawl/client';

// Reading a call notice's documents (PR C): one action per document, its state in a
// `callNoticeDocuments` table, the Markdown in file storage past 1 MB. Only the read exists yet.

const ReadDocumentAsMarkdownActionArgsSchema = z.object({ url: CallNoticeDocumentUrlSchema });
const ReadDocumentAsMarkdownActionReturnsSchema = z.object({ markdown: z.string() });

/** Reads one document through Firecrawl and gives its Markdown back, storing nothing. Spends credits. */
export const readDocumentAsMarkdown = internalZodAction({
  args: ReadDocumentAsMarkdownActionArgsSchema,
  returns: ReadDocumentAsMarkdownActionReturnsSchema,
  handler: async (_ctx, { url }) => ({
    markdown: await scrapeMarkdown(url, requiredEnv('FIRECRAWL_API_KEY')),
  }),
});
