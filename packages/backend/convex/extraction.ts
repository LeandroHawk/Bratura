import { callNoticeDeadline } from '@bratura/shared/entities/call-notice/fragments/registration-window/fields';
import { ReadCallNoticeDocumentSchema } from '@bratura/shared/entities/call-notice-document/entity';
import { CallNoticeExtractionSchema } from '@bratura/shared/entities/call-notice-extraction/entity';
import { documentId } from '@bratura/shared/primitives/code/id/fields';
import { z } from 'zod';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import type { ActionCtx } from './_generated/server';
import { internalZodAction, internalZodMutation, internalZodQuery } from './lib/builders';
import { requiredEnv } from './lib/env';
import {
  extractionPrompt,
  extractionPromptVersion,
  extractionTextFromDocuments,
} from './model/callNoticeExtraction/prompt';
import { verifyExtractionAnswer } from './model/callNoticeExtraction/verify';
import { generateJson } from './model/llm/generateJson';

// Extraction, by hand: each call notice's read documents → its fields through `model/llm/`, each
// value kept only when the source text proves it (`model/callNoticeExtraction/verify.ts`). The only
// writer of `callNoticeExtractions`. Return types are written out: this module calls its own
// functions through `internal`.

const CheckLlmCredentialsActionArgsSchema = z.object({});
const CheckLlmCredentialsActionReturnsSchema = z.literal(true);

/** Proves this deployment's LLM key answers JSON. Spends one free-tier call; reads no source. */
export const checkLlmCredentials = internalZodAction({
  args: CheckLlmCredentialsActionArgsSchema,
  returns: CheckLlmCredentialsActionReturnsSchema,
  handler: async () => {
    const answer = await generateJson('Answer exactly {"ok": true}.');
    z.object({ ok: z.literal(true) }).parse(answer);
    return true as const;
  },
});

// What is left to extract ----------------------------------------------------------------------

const sortedHashes = (documents: { markdownHash: string }[]) =>
  documents.map(({ markdownHash }) => markdownHash).sort();

const ReadDocumentKeySchema = ReadCallNoticeDocumentSchema.pick({
  callNoticeId: true,
  role: true,
  markdownHash: true,
});
type ReadDocumentKey = z.infer<typeof ReadDocumentKeySchema>;

/**
 * Rows per page of read documents. Each row carries its Markdown (up to 900 kB), and one query
 * that read them all hit Convex's 16 MiB read limit; the bytes cap below keeps a page under it.
 */
export const readDocumentKeysPageSize = 100;
const readDocumentKeysPageBytes = 8 * 1024 * 1024;

const ListReadDocumentKeysPageQueryArgsSchema = z.object({ cursor: z.string().nullable() });
const ListReadDocumentKeysPageQueryReturnsSchema = z.object({
  keys: z.array(ReadDocumentKeySchema),
  continueCursor: z.string(),
  isDone: z.boolean(),
});
type ReadDocumentKeysPage = z.infer<typeof ListReadDocumentKeysPageQueryReturnsSchema>;

/** One page of read documents, without their Markdown: what the queue needs to pick. */
export const listReadDocumentKeysPage = internalZodQuery({
  args: ListReadDocumentKeysPageQueryArgsSchema,
  returns: ListReadDocumentKeysPageQueryReturnsSchema,
  handler: async (ctx, { cursor }): Promise<ReadDocumentKeysPage> => {
    const { page, continueCursor, isDone } = await ctx.db
      .query('callNoticeDocuments')
      .withIndex('by_status', (index) => index.eq('status', 'read'))
      .paginate({
        cursor,
        numItems: readDocumentKeysPageSize,
        maximumBytesRead: readDocumentKeysPageBytes,
      });
    const keys = page.flatMap((document) =>
      document.status === 'read'
        ? [
            {
              callNoticeId: document.callNoticeId,
              role: document.role,
              markdownHash: document.markdownHash,
            },
          ]
        : [],
    );
    return { keys, continueCursor, isDone };
  },
});

const SelectCallNoticesToExtractQueryArgsSchema = z.object({
  readDocuments: z.array(ReadDocumentKeySchema),
});
const CallNoticesToExtractSchema = z.array(documentId('callNotices'));

/**
 * Of the call notices these read documents belong to, those never extracted or extracted from
 * other documents or an older prompt. Open calls closing soonest first, closed ones last (read for
 * what calls ask, user 2026-11-20); a call with no real deadline (`openEnded`) never.
 */
export const selectCallNoticesToExtract = internalZodQuery({
  args: SelectCallNoticesToExtractQueryArgsSchema,
  returns: CallNoticesToExtractSchema,
  handler: async (ctx, { readDocuments }): Promise<Id<'callNotices'>[]> => {
    const now = Date.now();
    const byCallNotice = new Map<Id<'callNotices'>, ReadDocumentKey[]>();
    for (const document of readDocuments) {
      const documents = byCallNotice.get(document.callNoticeId) ?? [];
      documents.push(document);
      byCallNotice.set(document.callNoticeId, documents);
    }

    const toExtract: { callNoticeId: Id<'callNotices'>; closesAt: number; closed: boolean }[] = [];
    for (const [callNoticeId, documents] of byCallNotice) {
      if (!documents.some(({ role }) => role === 'callNotice')) continue;
      const callNotice = await ctx.db.get(callNoticeId);
      const deadline = callNotice && callNoticeDeadline(callNotice, now);
      if (!deadline || deadline === 'openEnded') continue;
      const extracted = await ctx.db
        .query('callNoticeExtractions')
        .withIndex('by_call_notice', (index) => index.eq('callNoticeId', callNoticeId))
        .unique();
      const isCurrent =
        extracted?.promptVersion === extractionPromptVersion &&
        extracted.documentHashes.join() === sortedHashes(documents).join();
      if (isCurrent) continue;
      toExtract.push({
        callNoticeId,
        closesAt: callNotice!.registrationCloses?.at ?? Number.MAX_SAFE_INTEGER,
        closed: deadline === 'closed',
      });
    }
    return toExtract
      .sort((a, b) =>
        a.closed === b.closed
          ? a.closed
            ? b.closesAt - a.closesAt
            : a.closesAt - b.closesAt
          : Number(a.closed) - Number(b.closed),
      )
      .map(({ callNoticeId }) => callNoticeId);
  },
});

/** Reads every read document's keys page by page, then picks the queue from them. */
async function callNoticesToExtract(ctx: ActionCtx): Promise<Id<'callNotices'>[]> {
  const readDocuments: ReadDocumentKey[] = [];
  let cursor: string | null = null;
  for (;;) {
    const page: ReadDocumentKeysPage = await ctx.runQuery(
      internal.extraction.listReadDocumentKeysPage,
      { cursor },
    );
    readDocuments.push(...page.keys);
    if (page.isDone) break;
    cursor = page.continueCursor;
  }
  return ctx.runQuery(internal.extraction.selectCallNoticesToExtract, { readDocuments });
}

const ListCallNoticesToExtractActionArgsSchema = z.object({});

/** What `extractPendingCallNotices` would extract, in its order; by hand, to count the queue. */
export const listCallNoticesToExtract = internalZodAction({
  args: ListCallNoticesToExtractActionArgsSchema,
  returns: CallNoticesToExtractSchema,
  handler: (ctx): Promise<Id<'callNotices'>[]> => callNoticesToExtract(ctx),
});

const GetExtractionInputQueryArgsSchema = z.object({ callNoticeId: documentId('callNotices') });
const GetExtractionInputQueryReturnsSchema = z.array(
  ReadCallNoticeDocumentSchema.pick({ url: true, role: true, markdown: true, markdownHash: true }),
);
type ExtractionInput = z.infer<typeof GetExtractionInputQueryReturnsSchema>;

/** A call notice's read documents, what its extraction reads. */
export const getExtractionInput = internalZodQuery({
  args: GetExtractionInputQueryArgsSchema,
  returns: GetExtractionInputQueryReturnsSchema,
  handler: async (ctx, { callNoticeId }): Promise<ExtractionInput> => {
    const documents = await ctx.db
      .query('callNoticeDocuments')
      .withIndex('by_call_notice_and_url', (index) => index.eq('callNoticeId', callNoticeId))
      .collect();
    return documents.flatMap((document) =>
      document.status === 'read'
        ? [
            {
              url: document.url,
              role: document.role,
              markdown: document.markdown,
              markdownHash: document.markdownHash,
            },
          ]
        : [],
    );
  },
});

// The only writer of `callNoticeExtractions` -----------------------------------------------------

const RecordExtractionMutationArgsSchema = CallNoticeExtractionSchema.omit({ extractedAt: true });
const RecordExtractionMutationReturnsSchema = z.null();

/** Stores a call notice's extraction, replacing the one before (natural key: the call notice). */
export const recordExtraction = internalZodMutation({
  args: RecordExtractionMutationArgsSchema,
  returns: RecordExtractionMutationReturnsSchema,
  handler: async (ctx, extraction) => {
    const row = { ...extraction, extractedAt: Date.now() };
    const known = await ctx.db
      .query('callNoticeExtractions')
      .withIndex('by_call_notice', (index) => index.eq('callNoticeId', extraction.callNoticeId))
      .unique();
    if (known) await ctx.db.replace(known._id, row);
    else await ctx.db.insert('callNoticeExtractions', row);
    return null;
  },
});

// The extraction loop, by hand -------------------------------------------------------------------

/** The free tier allows about 15 calls a minute: one every 5 s stays under it. */
export const extractionSpacingMs = 5_000;
/** Stops starting calls here: an action lives 10 min and one call may take 2 (its timeout). */
const extractionBudgetMs = 7 * 60 * 1000;

const sleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const ExtractPendingCallNoticesActionArgsSchema = z.object({
  /** At most this many calls to the model in this run. */
  limit: z.int().positive().max(100),
});
const ExtractPendingCallNoticesActionReturnsSchema = z.object({
  extracted: z.int().nonnegative(),
  failed: z.int().nonnegative(),
  valuesRefused: z.int().nonnegative(),
  left: z.int().nonnegative(),
  stoppedBy: z.enum(['nothingLeft', 'limit', 'timeBudget']),
});
type ExtractPendingCallNoticesResult = z.infer<typeof ExtractPendingCallNoticesActionReturnsSchema>;

/**
 * Extracts, one call at a time, what `listCallNoticesToExtract` lists. A model that fails or
 * answers no JSON is counted and logged, and the call is tried again by the next run. By hand
 * only: `pnpm exec convex run extraction:extractPendingCallNotices '{"limit":10}'`.
 */
export const extractPendingCallNotices = internalZodAction({
  args: ExtractPendingCallNoticesActionArgsSchema,
  returns: ExtractPendingCallNoticesActionReturnsSchema,
  handler: async (ctx, { limit }): Promise<ExtractPendingCallNoticesResult> => {
    const model = requiredEnv('LLM_MODEL');
    const pending = await callNoticesToExtract(ctx);
    const startedAt = Date.now();
    const result: ExtractPendingCallNoticesResult = {
      extracted: 0,
      failed: 0,
      valuesRefused: 0,
      left: pending.length,
      stoppedBy: 'nothingLeft',
    };
    for (const [index, callNoticeId] of pending.entries()) {
      if (index >= limit) return { ...result, stoppedBy: 'limit' };
      if (Date.now() - startedAt > extractionBudgetMs)
        return { ...result, stoppedBy: 'timeBudget' };
      if (index > 0) await sleep(extractionSpacingMs);

      const documents: ExtractionInput = await ctx.runQuery(
        internal.extraction.getExtractionInput,
        {
          callNoticeId,
        },
      );
      const text = extractionTextFromDocuments(documents);
      result.left -= 1;
      let answer: unknown;
      try {
        answer = await generateJson(extractionPrompt(text));
      } catch (error) {
        console.warn('Extraction failed', callNoticeId, error);
        result.failed += 1;
        continue;
      }
      const verified = verifyExtractionAnswer(answer, text);
      result.valuesRefused += verified.valuesRefused;
      await ctx.runMutation(internal.extraction.recordExtraction, {
        callNoticeId,
        documentHashes: sortedHashes(documents),
        promptVersion: extractionPromptVersion,
        model,
        ...verified,
      });
      result.extracted += 1;
    }
    return result;
  },
});
