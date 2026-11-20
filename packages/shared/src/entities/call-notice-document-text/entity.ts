import { z } from 'zod';
import { documentId } from '../../primitives/code/id/fields';

/** Past this, the Markdown would not fit a Convex row (1 MiB); the largest measured: 54k. */
export const callNoticeDocumentMarkdownMax = 900_000;

/**
 * Writes: `documents.ts`, with its read (`recordDocumentRead`). Comes from: Firecrawl `/scrape`, or
 * the PDF's text layer (`pdfText.ts`). Reads: extraction. Apart, so a row read to pick stays small.
 */
export const CallNoticeDocumentTextSchema = z.object({
  callNoticeDocumentId: documentId('callNoticeDocuments'),
  /** Firecrawl's Markdown, or plain text when the PDF's own text layer replaced it. */
  markdown: z.string().min(1).max(callNoticeDocumentMarkdownMax),
});

export type CallNoticeDocumentText = z.infer<typeof CallNoticeDocumentTextSchema>;
