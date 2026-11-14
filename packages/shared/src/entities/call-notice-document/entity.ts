import { z } from 'zod';
import { requiredSha256Hex } from '../../primitives/code/hash/fields';
import { documentId } from '../../primitives/code/id/fields';
import { requiredInstant } from '../../primitives/code/time/instant/fields';
import { CallNoticeDocumentUrlSchema } from '../call-notice/fragments/listing/fields';

/**
 * What a document is to its call, from its file name: the call notice itself, an amendment (moves
 * deadlines), the categories and amounts per project, or how proposals and portfolios are scored.
 */
export const CallNoticeDocumentRoleEnum = z.enum([
  'callNotice',
  'amendment',
  'categories',
  'criteria',
]);
export type CallNoticeDocumentRole = z.infer<typeof CallNoticeDocumentRoleEnum>;

/** Why a read failed, as a code: the provider's own text stays in the logs, never in a table. */
export const CallNoticeDocumentFailureEnum = z.enum([
  'noText',
  'tooLarge',
  'rateLimited',
  'outOfCredits',
  'providerError',
]);
export type CallNoticeDocumentFailure = z.infer<typeof CallNoticeDocumentFailureEnum>;

/** Past this, a document's Markdown would not fit a Convex row (1 MiB); the largest measured: 54k. */
export const callNoticeDocumentMarkdownMax = 900_000;

const callNoticeDocumentCommonFields = {
  callNoticeId: documentId('callNotices'),
  /** One of the call's `documentUrls`; with `callNoticeId`, the natural key: never read twice. */
  url: CallNoticeDocumentUrlSchema,
  role: CallNoticeDocumentRoleEnum,
};

/**
 * What Firecrawl charged for the read (1 per PDF page), a failed one included (an image-only PDF is
 * charged and has no text); `null` when its answer did not say, or it charged nothing (402, 429).
 */
const creditsUsed = z.int().nonnegative().nullable();

/** Reserved by a read in progress (outbox pattern): a second run skips it until it is stale. */
export const ReadingCallNoticeDocumentSchema = z.object({
  ...callNoticeDocumentCommonFields,
  status: z.literal('reading'),
  readingSince: requiredInstant,
});

export const ReadCallNoticeDocumentSchema = z.object({
  ...callNoticeDocumentCommonFields,
  status: z.literal('read'),
  markdown: z.string().min(1).max(callNoticeDocumentMarkdownMax),
  /** SHA-256 of `markdown`: extraction runs again only when it changes. */
  markdownHash: requiredSha256Hex,
  readAt: requiredInstant,
  creditsUsed,
});

export const FailedCallNoticeDocumentSchema = z.object({
  ...callNoticeDocumentCommonFields,
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
