import { convexTest } from 'convex-test';
import { ianaTimeZone } from '@bratura/shared/primitives/code/time/time-zone/fields';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { internal } from './_generated/api';
import { readDocumentKeysPageSize } from './extraction';
import schema from './schema';
import { federalMapasSource } from './model/sources/registry';
import { modules } from './test.setup';

const day = 24 * 60 * 60 * 1000;
const notice = 'https://mapacultural.secult.ce.gov.br/files/opportunity/8498/edital.pdf';
const markdown =
  'O valor total deste edital é de **R$ 160.000,00**.\nInscrições até 20 de novembro de 2026.';

async function withReadCallNotice(closesInDays = 9, amendmentsReadBefore = 0) {
  const t = convexTest(schema, modules);
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
    for (let index = 0; index < amendmentsReadBefore; index++)
      await ctx.db.insert('callNoticeDocuments', {
        callNoticeId,
        url: `${notice}?amendment=${index}`,
        role: 'amendment',
        status: 'read',
        markdown,
        markdownHash: 'b'.repeat(64),
        readAt: Date.now(),
        creditsUsed: 1,
      });
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

  test('a closed call is extracted too: what it asked still counts', async () => {
    const { t, callNoticeId } = await withReadCallNotice(-1);
    expect(await t.action(internal.extraction.listCallNoticesToExtract, {})).toEqual([
      callNoticeId,
    ]);
  });

  test('a call notice whose document is past the first page of read documents is listed', async () => {
    const { t, callNoticeId } = await withReadCallNotice(9, readDocumentKeysPageSize);
    expect(await t.action(internal.extraction.listCallNoticesToExtract, {})).toEqual([
      callNoticeId,
    ]);
  });
});
