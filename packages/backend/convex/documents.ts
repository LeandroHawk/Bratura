import {
  callNoticeDocumentMarkdownMax,
  FailedCallNoticeDocumentSchema,
  ReadCallNoticeDocumentSchema,
  type CallNoticeDocument,
  type CallNoticeDocumentFailure,
} from '@bratura/shared/entities/call-notice-document/entity';
import { CallNoticeDocumentIdentityFields } from '@bratura/shared/entities/call-notice-document/fragments/identity/fields';
import { SourceAccessFields } from '@bratura/shared/entities/source/fragments/access/fields';
import { z } from 'zod';
import { internal } from './_generated/api';
import type { Doc } from './_generated/dataModel';
import type { ActionCtx, MutationCtx, QueryCtx } from './_generated/server';
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
  firecrawlRequestSpacingMs,
  onceMoreIfRateLimited,
  scrapeMarkdown,
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

/**
 * Query keys a site changes per visit: Paulo Afonso's file links carry a WordPress `_wpnonce` that
 * changes daily (2026-11-17), so with it the same file would be a new document, read again, daily.
 */
const perVisitQueryKeys = ['_wpnonce'];

/** The URL a document is stored and known by: the listed one without its per-visit keys. */
function documentKeyUrl(url: string) {
  const parsed = new URL(url);
  if (!perVisitQueryKeys.some((key) => parsed.searchParams.has(key))) return url;
  for (const key of perVisitQueryKeys) parsed.searchParams.delete(key);
  return parsed.href;
}

const knownDocument = (
  ctx: QueryCtx,
  { callNoticeId, url }: Pick<CallNoticeDocument, 'callNoticeId' | 'url'>,
) =>
  ctx.db
    .query('callNoticeDocuments')
    .withIndex('by_call_notice_and_url', (index) =>
      index.eq('callNoticeId', callNoticeId).eq('url', documentKeyUrl(url)),
    )
    .unique();

// What is left to read ----------------------------------------------------------------------------

const DocumentToReadSchema = CallNoticeDocumentIdentityFields;
type DocumentToRead = z.infer<typeof DocumentToReadSchema>;

const ListDocumentsWorthReadingQueryArgsSchema = z.object({});
const DocumentsToReadSchema = z.array(DocumentToReadSchema);

/**
 * The documents worth reading of the calls in the readable window, read or not, the calls closing
 * soonest first (they matter most to an alert), through the close-date index.
 */
export const listDocumentsWorthReading = internalZodQuery({
  args: ListDocumentsWorthReadingQueryArgsSchema,
  returns: DocumentsToReadSchema,
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

    const worthReading: DocumentToRead[] = [];
    for (const callNotice of [...closingSoonestFirst, ...withoutCloseDate]) {
      if (reasonToSkipReadingDocuments(callNotice, now) !== null) continue;
      for (const { url, role } of documentsWorthReading(
        callNotice.documentUrls,
        callNotice.documentLabels,
        callNotice.officialUrl,
      )) {
        worthReading.push({ callNoticeId: callNotice._id, url, role });
      }
    }
    return worthReading;
  },
});

/**
 * Documents checked per query: a read one carries its Markdown (up to 900 kB, so 15 stay under
 * Convex's 16 MiB read limit); one query that checked them all read 14 MB on 2026-11-19.
 */
export const documentsCheckedPerQuery = 15;

const SelectDocumentsNeedingReadQueryArgsSchema = z.object({
  documents: DocumentsToReadSchema.max(documentsCheckedPerQuery),
});

/** Of these documents, those never read, failed for a passing reason, or reserved too long. */
export const selectDocumentsNeedingRead = internalZodQuery({
  args: SelectDocumentsNeedingReadQueryArgsSchema,
  returns: DocumentsToReadSchema,
  handler: async (ctx, { documents }): Promise<DocumentToRead[]> => {
    const now = Date.now();
    const needingRead: DocumentToRead[] = [];
    for (const document of documents) {
      if (needsRead(await knownDocument(ctx, document), now)) needingRead.push(document);
    }
    return needingRead;
  },
});

/** The documents worth reading that still need a read, checked a few per query, in their order. */
async function documentsToRead(ctx: ActionCtx): Promise<DocumentToRead[]> {
  const worthReading: DocumentToRead[] = await ctx.runQuery(
    internal.documents.listDocumentsWorthReading,
    {},
  );
  const toRead: DocumentToRead[] = [];
  for (let start = 0; start < worthReading.length; start += documentsCheckedPerQuery) {
    const needingRead: DocumentToRead[] = await ctx.runQuery(
      internal.documents.selectDocumentsNeedingRead,
      { documents: worthReading.slice(start, start + documentsCheckedPerQuery) },
    );
    toRead.push(...needingRead);
  }
  return toRead;
}

const ListDocumentsToReadActionArgsSchema = z.object({});

/** What `readPendingDocuments` would read, in its order; by hand, to see the queue first. */
export const listDocumentsToRead = internalZodAction({
  args: ListDocumentsToReadActionArgsSchema,
  returns: DocumentsToReadSchema,
  handler: (ctx): Promise<DocumentToRead[]> => documentsToRead(ctx),
});

// The only writer of `callNoticeDocuments` --------------------------------------------------------

/** The read itself goes to the URL as listed today: only that one carries a valid nonce. */
async function replaceDocument(ctx: MutationCtx, listed: CallNoticeDocument) {
  const document = { ...listed, url: documentKeyUrl(listed.url) };
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

const GetDocumentSourceQueryArgsSchema = CallNoticeDocumentIdentityFields.pick({
  callNoticeId: true,
});
const DocumentSourceSchema = SourceAccessFields.extend({ sourceUrl: z.string() });
const GetDocumentSourceQueryReturnsSchema = DocumentSourceSchema.nullable();
type DocumentSource = z.infer<typeof DocumentSourceSchema>;

/**
 * The registered URL of the source a call notice came from (the only host our backend fetches)
 * and whether it answers only from Brazil.
 */
export const getDocumentSource = internalZodQuery({
  args: GetDocumentSourceQueryArgsSchema,
  returns: GetDocumentSourceQueryReturnsSchema,
  handler: async (ctx, { callNoticeId }): Promise<DocumentSource | null> => {
    const callNotice = await ctx.db.get(callNoticeId);
    const source = callNotice && (await ctx.db.get(callNotice.sourceId));
    if (!source) return null;
    const { answersOnlyFromBrazil } = source;
    if (source.kind === 'mapasCulturaisInstance') {
      return { sourceUrl: source.baseUrl, answersOnlyFromBrazil };
    }
    if (source.kind === 'officialPage') {
      return { sourceUrl: source.listingUrl, answersOnlyFromBrazil };
    }
    return { sourceUrl: source.siteUrl, answersOnlyFromBrazil };
  },
});

// The read loop, by hand -------------------------------------------------------------------------

/**
 * A read this thin lost its body text (2026-11-15, 120 reads: Estância's gazettes gave 65 and 119
 * characters per page, page headers only; every other read at least 423, median 1,869). A one- or
 * two-page annex can be that short and be whole.
 */
const isThinRead = (text: string, pages: number) => pages >= 3 && text.length / pages < 300;

/**
 * Stops starting reads here. An action lives 10 min, and one read may take 5: two Firecrawl
 * timeouts (2 min each) around one rate-limit wait (1 min).
 */
const readLoopBudgetMs = 4 * 60 * 1000;

const sleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

/**
 * The PDF's own text layer when Firecrawl's read came back thin (`isThinRead`): its parser drops
 * the body of some gazette PDFs that pdf.js reads whole (Estância, 2026-11-15; reported to
 * Firecrawl). `null` when the source is gone, answers only from Brazil (our backend's own fetch
 * times out there), or the file cannot be read on its host.
 */
async function pdfTextOfThinRead(
  ctx: ActionCtx,
  document: DocumentToRead,
  source: DocumentSource | null,
) {
  if (!source || source.answersOnlyFromBrazil) return null;
  const { sourceUrl } = source;
  // A file that crashes the parser (out of memory) is no text, not a provider error: that one is
  // retried every run, and each retry pays Firecrawl again.
  try {
    const { text }: { text: string | null } = await ctx.runAction(
      internal.pdfText.readPdfTextOnSourceHost,
      { url: document.url, sourceUrl },
    );
    return text;
  } catch (error) {
    console.warn('PDF text action failed', document.url, String(error));
    return null;
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
    const pending = await documentsToRead(ctx);
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
      if (readsStarted > 0) await sleep(firecrawlRequestSpacingMs);
      readsStarted += 1;

      let failure: CallNoticeDocumentFailure | null = null;
      let creditsUsed: number | null = null;
      let answeredWithoutCost = false;
      try {
        const source: DocumentSource | null = await ctx.runQuery(
          internal.documents.getDocumentSource,
          { callNoticeId: document.callNoticeId },
        );
        const answer = await onceMoreIfRateLimited(() =>
          scrapeMarkdown(document.url, apiKey, source ?? {}),
        );
        creditsUsed = answer.creditsUsed;
        answeredWithoutCost = creditsUsed === null;
        result.creditsUsed += creditsUsed ?? 0;
        let markdown = answer.markdown;
        if (creditsUsed !== null && isThinRead(markdown, creditsUsed)) {
          const local = await pdfTextOfThinRead(ctx, document, source);
          markdown = local !== null && !isThinRead(local, creditsUsed) ? local : '';
        }
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
