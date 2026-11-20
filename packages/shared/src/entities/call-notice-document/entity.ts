import { z } from 'zod';
import { requiredSha256Hex } from '../../primitives/code/hash/fields';
import { requiredInstant } from '../../primitives/code/time/instant/fields';
import { CallNoticeDocumentTextSchema } from '../call-notice-document-text/entity';
import { CallNoticeDocumentIdentityFields } from './fragments/identity/fields';

/** Why a read failed, as a code: the provider's own text stays in the logs, never in a table. */
export const CallNoticeDocumentFailureEnum = z.enum([
  'noText',
  'tooLarge',
  'rateLimited',
  'outOfCredits',
  'providerError',
]);
export type CallNoticeDocumentFailure = z.infer<typeof CallNoticeDocumentFailureEnum>;

/**
 * What Firecrawl charged for the read (1 per PDF page), a failed one included (an image-only PDF is
 * charged and has no text); `null` when its answer did not say, or it charged nothing (402, 429).
 */
const creditsUsed = z.int().nonnegative().nullable();

/** Reserved by a read in progress (outbox pattern): a second run skips it until it is stale. */
export const ReadingCallNoticeDocumentSchema = z.object({
  ...CallNoticeDocumentIdentityFields.shape,
  status: z.literal('reading'),
  readingSince: requiredInstant,
});

export const ReadCallNoticeDocumentSchema = z.object({
  ...CallNoticeDocumentIdentityFields.shape,
  status: z.literal('read'),
  /**
   * Moved to `callNoticeDocumentTexts`; left only on rows `moveDocumentTextsToOwnTable` has not
   * moved yet, and removed once the migration is done.
   */
  markdown: CallNoticeDocumentTextSchema.shape.markdown.optional(),
  /** SHA-256 of the document's text: extraction runs again only when it changes. */
  markdownHash: requiredSha256Hex,
  readAt: requiredInstant,
  creditsUsed,
});

export const FailedCallNoticeDocumentSchema = z.object({
  ...CallNoticeDocumentIdentityFields.shape,
  status: z.literal('failed'),
  failedAt: requiredInstant,
  failure: CallNoticeDocumentFailureEnum,
  creditsUsed,
});

/**
 * Writes: `documents.ts`, when documents are read by hand (`readPendingDocuments`). Comes from:
 * Firecrawl `/scrape` of one `documentUrls` link. Reads: both queues and extraction. Small on
 * purpose: the text lives in `callNoticeDocumentTexts`.
 */
export const CallNoticeDocumentSchema = z.discriminatedUnion('status', [
  ReadingCallNoticeDocumentSchema,
  ReadCallNoticeDocumentSchema,
  FailedCallNoticeDocumentSchema,
]);

export type CallNoticeDocument = z.infer<typeof CallNoticeDocumentSchema>;
