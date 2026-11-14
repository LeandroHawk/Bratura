import { z } from 'zod';
import { requiredSha256Hex } from '../../primitives/code/hash/fields';
import { requiredInstant } from '../../primitives/code/time/instant/fields';
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

/** Past this, the Markdown would not fit a Convex row (1 MiB); the largest measured: 54k. */
export const callNoticeDocumentMarkdownMax = 900_000;

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
  markdown: z.string().min(1).max(callNoticeDocumentMarkdownMax),
  /** SHA-256 of `markdown`: extraction runs again only when it changes. */
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
 * Firecrawl `/scrape` of one `documentUrls` link. Reads: extraction (16–18/11).
 */
export const CallNoticeDocumentSchema = z.discriminatedUnion('status', [
  ReadingCallNoticeDocumentSchema,
  ReadCallNoticeDocumentSchema,
  FailedCallNoticeDocumentSchema,
]);

export type CallNoticeDocument = z.infer<typeof CallNoticeDocumentSchema>;
