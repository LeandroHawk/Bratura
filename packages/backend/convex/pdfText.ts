'use node';

import { requiredHttpsUrl, requiredHttpUrl } from '@bratura/shared/primitives/code/url/fields';
import { z } from 'zod';
import { internalZodAction } from './lib/builders';
import { pdfTextOnSourceHost } from './model/pdfText/pdfTextOnSourceHost';

// The PDF parser needs the Node runtime: a 20 MB file outgrows the default runtime's 64 MiB.

const ReadPdfTextOnSourceHostActionArgsSchema = z.object({
  url: requiredHttpUrl,
  /** The registered source's own URL: its host is the only one fetched. */
  sourceUrl: requiredHttpsUrl,
});
const ReadPdfTextOnSourceHostActionReturnsSchema = z.object({ text: z.string().nullable() });

/** A document's PDF text layer, for a read Firecrawl answered nearly empty (`documents.ts`). */
export const readPdfTextOnSourceHost = internalZodAction({
  args: ReadPdfTextOnSourceHostActionArgsSchema,
  returns: ReadPdfTextOnSourceHostActionReturnsSchema,
  handler: async (_ctx, { url, sourceUrl }): Promise<{ text: string | null }> => ({
    text: await pdfTextOnSourceHost(url, sourceUrl),
  }),
});
