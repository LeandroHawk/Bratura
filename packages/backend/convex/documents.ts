import {
  callNoticeDocumentMarkdownMax,
  FailedCallNoticeDocumentSchema,
  ReadCallNoticeDocumentSchema,
  type CallNoticeDocument,
  type CallNoticeDocumentFailure,
} from '@bratura/shared/entities/call-notice-document/entity';
import { CallNoticeDocumentIdentityFields } from '@bratura/shared/entities/call-notice-document/fragments/identity/fields';
import { z } from 'zod';
import { internal } from './_generated/api';
import type { Doc } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';
import { internalZodAction, internalZodMutation, internalZodQuery } from './lib/builders';
import { requiredEnv } from './lib/env';
import { sha256Hex } from './lib/sha256';
import {
  documentsWorthReading,
  readableRegistrationCloses,
  reasonToSkipReadingDocuments,
} from './model/callNoticeDocuments/selection';
import {
  FirecrawlOutOfCreditsError,
  FirecrawlRateLimitedError,
  scrapeMarkdown,
  type ScrapedMarkdown,
} from './model/firecrawl/client';

// Reading call notices' documents as Markdown, by hand: what is left to read, the reservation and
// the result (the only writer of `callNoticeDocuments`), and the read loop. Which calls and files
// are worth credits: `model/callNoticeDocuments/selection.ts`. Return types are written out: this
// module calls its own functions through `internal`.

/**
 * Failures that would repeat at the same cost (an image-only PDF has no text however often it is
 * paid for): never retried, they wait for the admin review. Every other failure is retried.
 */
const permanentFailures: ReadonlySet<CallNoticeDocumentFailure> = new Set(['noText', 'tooLarge']);

/** A reservation older than this is taken as dead (its action stopped) and may be read again. */
export const documentReadingLeaseMs = 10 * 60 * 1000;

/** Whether a document still needs a read: never read, a retryable failure, a dead reservation. */
function needsRead(known: CallNoticeDocument | null, now: number) {
  if (!known) return true;
  if (known.status === 'read') return false;
  if (known.status === 'failed') return !permanentFailures.has(known.failure);
  return now - known.readingSince >= documentReadingLeaseMs;
}

const knownDocument = (
  ctx: QueryCtx,
  { callNoticeId, url }: Pick<CallNoticeDocument, 'callNoticeId' | 'url'>,
) =>
  ctx.db
    .query('callNoticeDocuments')
    .withIndex('by_call_notice_and_url', (index) =>
      index.eq('callNoticeId', callNoticeId).eq('url', url),
    )
    .unique();

// What is left to read ----------------------------------------------------------------------------

const DocumentToReadSchema = CallNoticeDocumentIdentityFields;
type DocumentToRead = z.infer<typeof DocumentToReadSchema>;

const ListDocumentsToReadQueryArgsSchema = z.object({});
const ListDocumentsToReadQueryReturnsSchema = z.array(DocumentToReadSchema);

/**
 * The documents worth reading that still need a read, the calls closing soonest first (they matter
 * most to an alert). Only calls in the readable window are scanned, through the close-date index.
 */
export const listDocumentsToRead = internalZodQuery({
  args: ListDocumentsToReadQueryArgsSchema,
  returns: ListDocumentsToReadQueryReturnsSchema,
  handler: async (ctx): Promise<DocumentToRead[]> => {
    const now = Date.now();
    const { from, to } = readableRegistrationCloses(now);
    const closingSoonestFirst = await ctx.db
      .query('callNotices')
      .withIndex('by_registration_closes', (index) =>
        index.gte('registrationCloses.at', from).lte('registrationCloses.at', to),
      )
      .collect();
    const withoutCloseDate = await ctx.db
      .query('callNotices')
      .withIndex('by_registration_closes', (index) => index.eq('registrationCloses.at', undefined))
      .collect();

    const toRead: DocumentToRead[] = [];
    for (const callNotice of [...closingSoonestFirst, ...withoutCloseDate]) {
      if (reasonToSkipReadingDocuments(callNotice, now) !== null) continue;
      for (const { url, role } of documentsWorthReading(callNotice.documentUrls)) {
        const document = { callNoticeId: callNotice._id, url, role };
        if (needsRead(await knownDocument(ctx, document), now)) toRead.push(document);
      }
    }
    return toRead;
  },
});

// The only writer of `callNoticeDocuments` --------------------------------------------------------

async function replaceDocument(ctx: MutationCtx, document: CallNoticeDocument) {
  const known: Doc<'callNoticeDocuments'> | null = await knownDocument(ctx, document);
  if (known) await ctx.db.replace(known._id, document);
  else await ctx.db.insert('callNoticeDocuments', document);
}

const ReserveDocumentReadMutationArgsSchema = DocumentToReadSchema;
const ReserveDocumentReadMutationReturnsSchema = z.boolean();

/**
 * Reserves a document before it is paid for (outbox pattern): `false` when it no longer needs a
 * read, or another run holds it, so two runs never pay for the same document.
 */
export const reserveDocumentRead = internalZodMutation({
  args: ReserveDocumentReadMutationArgsSchema,
  returns: ReserveDocumentReadMutationReturnsSchema,
  handler: async (ctx, document) => {
    const now = Date.now();
    if (!needsRead(await knownDocument(ctx, document), now)) return false;
    await replaceDocument(ctx, { ...document, status: 'reading', readingSince: now });
    return true;
  },
});

const RecordDocumentReadMutationArgsSchema = ReadCallNoticeDocumentSchema.omit({
  status: true,
  readAt: true,
});
const RecordDocumentReadMutationReturnsSchema = z.null();

/** Stores a reserved document's Markdown. */
export const recordDocumentRead = internalZodMutation({
  args: RecordDocumentReadMutationArgsSchema,
  returns: RecordDocumentReadMutationReturnsSchema,
  handler: async (ctx, document) => {
    await replaceDocument(ctx, { ...document, status: 'read', readAt: Date.now() });
    return null;
  },
});

const RecordDocumentFailureMutationArgsSchema = FailedCallNoticeDocumentSchema.omit({
  status: true,
  failedAt: true,
});
const RecordDocumentFailureMutationReturnsSchema = z.null();

/** Stores why a reserved document could not be read, as a code. */
export const recordDocumentFailure = internalZodMutation({
  args: RecordDocumentFailureMutationArgsSchema,
  returns: RecordDocumentFailureMutationReturnsSchema,
  handler: async (ctx, document) => {
    await replaceDocument(ctx, { ...document, status: 'failed', failedAt: Date.now() });
    return null;
  },
});

// The read loop, by hand -------------------------------------------------------------------------

/** Firecrawl allows about 10 scrapes a minute: one every 6.5 s stays under it. */
export const documentReadSpacingMs = 6_500;
/** A 429 waits this long before the one retry. */
const rateLimitWaitMs = 60_000;
/**
 * Stops starting reads here. An action lives 10 min, and one read may take 5: two Firecrawl
 * timeouts (2 min each) around one rate-limit wait (1 min).
 */
const readLoopBudgetMs = 4 * 60 * 1000;

const sleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

async function scrapeOnceMoreIfRateLimited(url: string, apiKey: string): Promise<ScrapedMarkdown> {
  try {
    return await scrapeMarkdown(url, apiKey);
  } catch (error) {
    if (!(error instanceof FirecrawlRateLimitedError)) throw error;
    await sleep(rateLimitWaitMs);
    return await scrapeMarkdown(url, apiKey);
  }
}

function failureOfError(error: unknown): CallNoticeDocumentFailure {
  if (error instanceof FirecrawlRateLimitedError) return 'rateLimited';
  console.warn('Document read failed', error);
  return 'providerError';
}

const ReadPendingDocumentsActionArgsSchema = z.object({
  /** Stops starting reads once this many credits are spent; one read may pass it (its pages). */
  creditCeiling: z.int().positive().max(2_000),
});
const ReadPendingDocumentsActionReturnsSchema = z.object({
  read: z.int().nonnegative(),
  failed: z.int().nonnegative(),
  creditsUsed: z.int().nonnegative(),
  left: z.int().nonnegative(),
  stoppedBy: z.enum(['nothingLeft', 'creditCeiling', 'timeBudget', 'outOfCredits', 'unknownCost']),
});
type ReadPendingDocumentsResult = z.infer<typeof ReadPendingDocumentsActionReturnsSchema>;

/**
 * Reads, one at a time, what `listDocumentsToRead` lists, until none is left, the credit ceiling
 * or the time budget is reached, or the plan runs out (402). An answer without its cost also stops
 * the run: the ceiling could not hold. Run it again for the rest. By hand
 * only: `pnpm exec convex run documents:readPendingDocuments '{"creditCeiling":200}'`.
 */
export const readPendingDocuments = internalZodAction({
  args: ReadPendingDocumentsActionArgsSchema,
  returns: ReadPendingDocumentsActionReturnsSchema,
  handler: async (ctx, { creditCeiling }): Promise<ReadPendingDocumentsResult> => {
    const apiKey = requiredEnv('FIRECRAWL_API_KEY');
    const pending: DocumentToRead[] = await ctx.runQuery(
      internal.documents.listDocumentsToRead,
      {},
    );
    const startedAt = Date.now();
    const result: ReadPendingDocumentsResult = {
      read: 0,
      failed: 0,
      creditsUsed: 0,
      left: pending.length,
      stoppedBy: 'nothingLeft',
    };
    let readsStarted = 0;
    for (const document of pending) {
      if (result.creditsUsed >= creditCeiling) return { ...result, stoppedBy: 'creditCeiling' };
      if (Date.now() - startedAt > readLoopBudgetMs) return { ...result, stoppedBy: 'timeBudget' };
      const reserved: boolean = await ctx.runMutation(
        internal.documents.reserveDocumentRead,
        document,
      );
      if (!reserved) {
        result.left -= 1;
        continue;
      }
      if (readsStarted > 0) await sleep(documentReadSpacingMs);
      readsStarted += 1;

      let failure: CallNoticeDocumentFailure | null = null;
      let creditsUsed: number | null = null;
      let answeredWithoutCost = false;
      try {
        const { markdown, ...answer } = await scrapeOnceMoreIfRateLimited(document.url, apiKey);
        creditsUsed = answer.creditsUsed;
        answeredWithoutCost = creditsUsed === null;
        result.creditsUsed += creditsUsed ?? 0;
        if (markdown.trim() === '') failure = 'noText';
        else if (markdown.length > callNoticeDocumentMarkdownMax) failure = 'tooLarge';
        else
          await ctx.runMutation(internal.documents.recordDocumentRead, {
            ...document,
            markdown,
            markdownHash: await sha256Hex(markdown),
            creditsUsed,
          });
      } catch (error) {
        if (error instanceof FirecrawlOutOfCreditsError) {
          await ctx.runMutation(internal.documents.recordDocumentFailure, {
            ...document,
            failure: 'outOfCredits',
            creditsUsed: null,
          });
          return { ...result, stoppedBy: 'outOfCredits' };
        }
        failure = failureOfError(error);
      }
      result.left -= 1;
      if (failure === null) result.read += 1;
      else {
        result.failed += 1;
        await ctx.runMutation(internal.documents.recordDocumentFailure, {
          ...document,
          failure,
          creditsUsed,
        });
      }
      if (answeredWithoutCost) return { ...result, stoppedBy: 'unknownCost' };
    }
    return result;
  },
});
