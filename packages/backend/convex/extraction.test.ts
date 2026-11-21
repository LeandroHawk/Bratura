import { convexTest } from 'convex-test';
import { ianaTimeZone } from '@bratura/shared/primitives/code/time/time-zone/fields';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { readDocumentKeysPageSize } from './extraction';
import schema from './schema';
import { federalMapasSource } from './model/sources/registry';
import { modules } from './test.setup';

const day = 24 * 60 * 60 * 1000;
const notice = 'https://mapacultural.secult.ce.gov.br/files/opportunity/8498/edital.pdf';
const markdown =
  'O valor total deste edital é de **R$ 160.000,00**.\nInscrições até 20 de novembro de 2026.';

async function withReadCallNotice(
  closesInDays = 9,
  amendmentsReadBefore = 0,
  t = convexTest(schema, modules),
) {
  const sourceId = await t.run((ctx) => ctx.db.insert('sources', federalMapasSource));
  const { callNoticeId } = await t.mutation(internal.callNotices.recordCallNotice, {
    sourceId,
    externalId: '8498',
    title: 'Edital das Artes',
    summary: null,
    officialUrl: 'https://mapacultural.secult.ce.gov.br/oportunidade/8498/',
    documentUrls: [notice],
    registrationOpens: null,
    registrationCloses: {
      at: Date.now() + closesInDays * day,
      timeZone: ianaTimeZone.parse('America/Fortaleza'),
      precision: 'minute',
    },
  });
  await t.run(async (ctx) => {
    for (let index = 0; index < amendmentsReadBefore; index++) {
      const callNoticeDocumentId = await ctx.db.insert('callNoticeDocuments', {
        callNoticeId,
        url: `${notice}?amendment=${index}`,
        role: 'amendment',
        status: 'read',
        markdownHash: 'b'.repeat(64),
        readAt: Date.now(),
        creditsUsed: 1,
      });
      await ctx.db.insert('callNoticeDocumentTexts', { callNoticeDocumentId, markdown });
    }
  });
  await t.mutation(internal.documents.recordDocumentRead, {
    callNoticeId,
    url: notice,
    role: 'callNotice',
    markdown,
    markdownHash: 'a'.repeat(64),
    creditsUsed: 1,
  });
  return { t, callNoticeId };
}

function modelAnswers(answer: unknown, status = 200) {
  const fetchMock = vi.fn<typeof fetch>(async () =>
    status === 200
      ? new Response(
          JSON.stringify({ choices: [{ message: { content: JSON.stringify(answer) } }] }),
        )
      : new Response('overloaded', { status }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const extractPending = (t: ReturnType<typeof convexTest>) =>
  t.action(internal.extraction.extractPendingCallNotices, { limit: 10 });

const extractionsOf = (t: ReturnType<typeof convexTest>) =>
  t.run((ctx) => ctx.db.query('callNoticeExtractions').collect());

describe('extractPendingCallNotices', () => {
  beforeEach(() => {
    vi.stubEnv('LLM_BASE_URL', 'https://llm.example.com/v1');
    vi.stubEnv('LLM_MODEL', 'test-model');
    vi.stubEnv('LLM_API_KEY', 'llm-key');
    vi.stubGlobal('setTimeout', (resolve: () => void) => resolve());
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  test('stores what the text proves, with its source quote, and extracts it only once', async () => {
    const { t, callNoticeId } = await withReadCallNotice();
    const fetchMock = modelAnswers({
      totalBudgetInCents: {
        value: 16_000_000,
        quote: 'O valor total deste edital é de R$ 160.000,00.',
      },
      registrationCloses: { date: '2026-11-20', quote: 'Inscrições até 20 de novembro de 2026.' },
      amountsPerProject: [
        { category: 'Teatro', amountInCents: 500_000, quote: 'R$ 5.000,00 por projeto' },
      ],
    });

    expect(await extractPending(t)).toEqual({
      extracted: 1,
      failed: 0,
      valuesRefused: 1,
      left: 0,
      stoppedBy: 'nothingLeft',
    });
    const [stored] = await extractionsOf(t);
    expect(stored).toMatchObject({
      callNoticeId,
      model: 'test-model',
      documentHashes: ['a'.repeat(64)],
      totalBudget: {
        amountInCents: 16_000_000,
        quote: 'O valor total deste edital é de R$ 160.000,00.',
      },
      registrationCloses: { date: '2026-11-20' },
      amountsPerProject: [],
      valuesRefused: 1,
    });

    expect(await extractPending(t)).toMatchObject({ extracted: 0, left: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('sends the text without Markdown emphasis, marked as data', async () => {
    const { t } = await withReadCallNotice();
    const fetchMock = modelAnswers({});
    await extractPending(t);
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    const prompt: string = body.messages.at(-1).content;
    expect(prompt).toContain(
      '<<<EDITAL\n=== DOCUMENTO: edital.pdf ===\nO valor total deste edital é de R$ 160.000,00.',
    );
    expect(prompt).not.toContain('**');
  });

  test('a model that fails is counted, and the call is tried again by the next run', async () => {
    const { t } = await withReadCallNotice();
    modelAnswers({}, 503);
    expect(await extractPending(t)).toMatchObject({ extracted: 0, failed: 1 });
    expect(await extractionsOf(t)).toEqual([]);

    modelAnswers({});
    expect(await extractPending(t)).toMatchObject({ extracted: 1 });
  });

  test('a call whose input cannot be built is skipped and counted; the run goes on to the next', async () => {
    const { t, callNoticeId: broken } = await withReadCallNotice(2);
    await withReadCallNotice(9, 0, t);
    // A read document left with no text anywhere (an out-of-band edit): its call comes first.
    await t.run(async (ctx) => {
      const documents = await ctx.db.query('callNoticeDocuments').collect();
      const document = documents.find((stored) => stored.callNoticeId === broken)!;
      const texts = await ctx.db.query('callNoticeDocumentTexts').collect();
      const text = texts.find((stored) => stored.callNoticeDocumentId === document._id)!;
      await ctx.db.delete(text._id);
    });
    modelAnswers({});
    expect(await extractPending(t)).toMatchObject({ extracted: 1, failed: 1, left: 0 });
    const extracted = await extractionsOf(t);
    expect(extracted.map(({ callNoticeId }) => callNoticeId)).not.toContain(broken);
  });

  test('a call seen open and closed since is extracted too: what it asked still counts', async () => {
    const { t, callNoticeId } = await withReadCallNotice(-1);
    await t.run((ctx) =>
      ctx.db.patch(callNoticeId, {
        firstSeenAt: Date.now() - 10 * day,
        closedWhenFirstSeen: false,
      }),
    );
    expect(await t.action(internal.extraction.listCallNoticesToExtract, {})).toEqual([
      callNoticeId,
    ]);
  });

  test('a call stored as closed when first seen (a result posted, no close) is extracted only when picked by hand', async () => {
    const { t, callNoticeId } = await withReadCallNotice();
    await t.run((ctx) => ctx.db.patch(callNoticeId, { closedWhenFirstSeen: true }));
    expect(await t.action(internal.extraction.listCallNoticesToExtract, {})).toEqual([]);
    expect(
      await t.action(internal.extraction.listCallNoticesToExtract, {
        callNoticeIds: [callNoticeId],
      }),
    ).toEqual([callNoticeId]);
  });

  test('a call closed when first seen is extracted only when picked by hand', async () => {
    const { t, callNoticeId } = await withReadCallNotice(-1);
    expect(await t.action(internal.extraction.listCallNoticesToExtract, {})).toEqual([]);

    modelAnswers({});
    const picked = { limit: 10, callNoticeIds: [callNoticeId] };
    expect(await t.action(internal.extraction.extractPendingCallNotices, picked)).toMatchObject({
      extracted: 1,
      left: 0,
    });
    expect(await extractionsOf(t)).toMatchObject([{ callNoticeId }]);
  });

  test('picked by hand, only the calls picked are extracted', async () => {
    const { t, callNoticeId } = await withReadCallNotice();
    const known = await t.run((ctx) => ctx.db.get(callNoticeId));
    const { callNoticeId: other } = await t.mutation(internal.callNotices.recordCallNotice, {
      sourceId: known!.sourceId,
      externalId: 'other',
      title: 'Outro edital',
      summary: null,
      officialUrl: 'https://mapacultural.secult.ce.gov.br/oportunidade/9999/',
      documentUrls: [],
      registrationOpens: null,
      registrationCloses: null,
    });
    expect(await t.action(internal.extraction.listCallNoticesToExtract, {})).toEqual([
      callNoticeId,
    ]);
    expect(
      await t.action(internal.extraction.listCallNoticesToExtract, { callNoticeIds: [other] }),
    ).toEqual([]);
  });

  test('a call notice whose document is past the first page of read documents is listed', async () => {
    const { t, callNoticeId } = await withReadCallNotice(9, readDocumentKeysPageSize);
    expect(await t.action(internal.extraction.listCallNoticesToExtract, {})).toEqual([
      callNoticeId,
    ]);
  });

  describe('reads a text only where it is used', () => {
    const limited = () =>
      convexTest({ schema, modules, transactionLimits: { bytesRead: 64 * 1024 } });
    const longAmendment = (callNoticeId: Id<'callNotices'>) => ({
      callNoticeId,
      url: `${notice}?amendment=long`,
      role: 'amendment' as const,
      markdown: 'x'.repeat(300_000),
      markdownHash: 'c'.repeat(64),
      creditsUsed: 1,
    });

    test('the extraction queue reads document keys, never their text', async () => {
      const { t, callNoticeId } = await withReadCallNotice(9, 0, limited());
      await t.mutation(internal.documents.recordDocumentRead, longAmendment(callNoticeId));
      expect(await t.action(internal.extraction.listCallNoticesToExtract, {})).toEqual([
        callNoticeId,
      ]);
      // The limit does catch a text read: this call's own input passes it.
      await expect(
        t.query(internal.extraction.getExtractionInput, { callNoticeId }),
      ).rejects.toThrow(/bytes/i);
    });

    test("a call's extraction input holds its own texts only", async () => {
      const { t, callNoticeId } = await withReadCallNotice(9, 0, limited());
      const known = await t.run((ctx) => ctx.db.get(callNoticeId));
      const { callNoticeId: other } = await t.mutation(internal.callNotices.recordCallNotice, {
        sourceId: known!.sourceId,
        externalId: 'other',
        title: 'Outro edital',
        summary: null,
        officialUrl: 'https://mapacultural.secult.ce.gov.br/oportunidade/9999/',
        documentUrls: [],
        registrationOpens: null,
        registrationCloses: null,
      });
      await t.mutation(internal.documents.recordDocumentRead, longAmendment(other));
      expect(await t.query(internal.extraction.getExtractionInput, { callNoticeId })).toEqual([
        { url: notice, role: 'callNotice', markdown, markdownHash: 'a'.repeat(64) },
      ]);
    });
  });
});
