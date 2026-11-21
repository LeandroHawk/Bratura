import { convexTest } from 'convex-test';
import { ianaTimeZone } from '@bratura/shared/primitives/code/time/time-zone/fields';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import {
  documentReadingLeaseMs,
  documentsCheckedPerQuery,
  documentTextsMovedPerRunBytes,
} from './documents';
import { chosenCallNoticesMax, isClosedAsOf } from './model/callNoticeDocuments/selection';
import schema from './schema';
import { cearaMapasSource, federalMapasSource, piedadePnabSource } from './model/sources/registry';
import { modules } from './test.setup';

const day = 24 * 60 * 60 * 1000;
const in9Days = () => ({
  at: Date.now() + 9 * day,
  timeZone: ianaTimeZone.parse('America/Fortaleza'),
  precision: 'minute' as const,
});

const documentBase = 'https://mapacultural.secult.ce.gov.br/files/opportunity/8498';
const mainNotice = `${documentBase}/edital-das-artes.pdf`;
const categories = `${documentBase}/anexo-i-categorias.pdf`;

type CallNoticeOptions = {
  documentUrls?: string[];
  externalId?: string;
  registrationCloses?: ReturnType<typeof in9Days> | null;
  /** When ingestion first found the call; now when absent. */
  firstSeenAt?: number;
  resultPosted?: boolean;
};

async function addCallNotice(
  t: ReturnType<typeof convexTest>,
  {
    documentUrls = [mainNotice, categories, `${documentBase}/resultado-final.pdf`],
    externalId = '8498',
    registrationCloses = in9Days(),
    firstSeenAt,
    resultPosted,
  }: CallNoticeOptions = {},
) {
  const sourceId =
    (await t.run((ctx) => ctx.db.query('sources').first()))?._id ??
    (await t.run((ctx) => ctx.db.insert('sources', federalMapasSource)));
  const { callNoticeId } = await t.mutation(internal.callNotices.recordCallNotice, {
    sourceId,
    externalId,
    title: `Edital ${externalId}`,
    summary: null,
    officialUrl: `https://mapacultural.secult.ce.gov.br/oportunidade/${externalId}/`,
    documentUrls,
    registrationOpens: null,
    registrationCloses,
    ...(resultPosted !== undefined && { resultPosted }),
  });
  // As if first recorded then: the flag `recordCallNotice` stores is the rule at that moment.
  if (firstSeenAt !== undefined) {
    const closedWhenFirstSeen = isClosedAsOf({ registrationCloses }, firstSeenAt);
    await t.run((ctx) => ctx.db.patch(callNoticeId, { firstSeenAt, closedWhenFirstSeen }));
  }
  return callNoticeId;
}

async function withCallNotice(documentUrls?: string[]) {
  const t = convexTest(schema, modules);
  const callNoticeId = await addCallNotice(t, documentUrls ? { documentUrls } : {});
  return { t, callNoticeId };
}

const documentsOf = (t: ReturnType<typeof convexTest>) =>
  t.run((ctx) => ctx.db.query('callNoticeDocuments').collect());

const textsOf = (t: ReturnType<typeof convexTest>) =>
  t.run((ctx) => ctx.db.query('callNoticeDocumentTexts').collect());

function firecrawlAnswersPerUrl(answer: (url: string) => Response) {
  const fetchMock = vi.fn<typeof fetch>(async (_input, init) =>
    answer(String(JSON.parse(String(init?.body)).url)),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const scraped = (markdown: string, creditsUsed: number) =>
  new Response(JSON.stringify({ success: true, data: { markdown, metadata: { creditsUsed } } }));

/** A PDF of one line per page, by hand; small type: pdf.js drops text past the page edge. */
function pdfWithText(pages: string[]) {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pages.map((_, i) => `${4 + 2 * i} 0 R`).join(' ')}] /Count ${pages.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ...pages.flatMap((text, i) => {
      const stream = `BT /F1 2 Tf 20 700 Td (${text}) Tj ET`;
      return [
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + 2 * i} 0 R >>`,
        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
      ];
    }),
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((body, i) => {
    const offset = pdf.length;
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
    return offset;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

/** Firecrawl answers `firecrawl`; the source's own host answers `pdf` (a local read). */
function firecrawlAndSourceAnswer(firecrawl: Response, pdf: Uint8Array<ArrayBuffer>) {
  const fetchMock = vi.fn<typeof fetch>(async (input) =>
    String(input).startsWith('https://api.firecrawl.dev/')
      ? firecrawl.clone()
      : new Response(pdf, { headers: { 'content-type': 'application/pdf' } }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const readPending = (t: ReturnType<typeof convexTest>, creditCeiling = 100) =>
  t.action(internal.documents.readPendingDocuments, { creditCeiling });

describe('readPendingDocuments', () => {
  beforeEach(() => {
    vi.stubEnv('FIRECRAWL_API_KEY', 'fc-key');
    vi.stubGlobal('setTimeout', (resolve: () => void) => resolve());
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  test('reads the call notice and its categories, never the result, and stores them once', async () => {
    const { t } = await withCallNotice();
    const fetchMock = firecrawlAnswersPerUrl((url) => scraped(`# ${url}`, 2));

    expect(await readPending(t)).toEqual({
      read: 2,
      failed: 0,
      creditsUsed: 4,
      left: 0,
      stoppedBy: 'nothingLeft',
    });
    const stored = await documentsOf(t);
    expect(stored.map(({ url, role, status }) => ({ url, role, status }))).toEqual([
      { url: mainNotice, role: 'callNotice', status: 'read' },
      { url: categories, role: 'categories', status: 'read' },
    ]);
    expect(stored[0]).toMatchObject({ creditsUsed: 2 });
    expect(stored[0]).not.toHaveProperty('markdown');
    expect(await textsOf(t)).toMatchObject([
      { callNoticeDocumentId: stored[0]?._id, markdown: `# ${mainNotice}` },
      { callNoticeDocumentId: stored[1]?._id, markdown: `# ${categories}` },
    ]);

    expect(await readPending(t)).toMatchObject({ read: 0, left: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("reads a file through the day's nonce and knows it by its URL without one", async () => {
    const withNonce = (nonce: string) => `${mainNotice}?id=9&_wpnonce=${nonce}`;
    const { t } = await withCallNotice([withNonce('6c41a9b411')]);
    const fetchMock = firecrawlAnswersPerUrl((url) => scraped(`# ${url}`, 1));

    expect(await readPending(t)).toMatchObject({ read: 1, left: 0 });
    expect(fetchMock.mock.calls.map(([, init]) => JSON.parse(String(init?.body)).url)).toEqual([
      withNonce('6c41a9b411'),
    ]);
    expect((await documentsOf(t)).map(({ url }) => url)).toEqual([`${mainNotice}?id=9`]);

    await addCallNotice(t, { documentUrls: [withNonce('0b2e7f9c13')] });
    expect(await readPending(t)).toMatchObject({ read: 0, left: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('reads nothing of a call whose notice no file name identifies', async () => {
    const { t } = await withCallNotice([categories, `${documentBase}/anexo-2-criterios.pdf`]);
    const fetchMock = firecrawlAnswersPerUrl(() => scraped('# Anexo', 2));
    expect(await readPending(t)).toMatchObject({ read: 0, left: 0, stoppedBy: 'nothingLeft' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('reads open calls, then undated ones, then those closed within a year', async () => {
    const t = convexTest(schema, modules);
    const urlOf = (id: string) =>
      `https://mapacultural.secult.ce.gov.br/files/opportunity/${id}/edital.pdf`;
    for (const [externalId, registrationCloses] of [
      ['later', { ...in9Days(), at: Date.now() + 30 * day }],
      ['undated', null],
      ['sooner', in9Days()],
      ['noDeadline', { ...in9Days(), at: Date.UTC(2111, 0, 1) }],
      ['closedOverAYearAgo', { ...in9Days(), at: Date.now() - 400 * day }],
      ['closedYesterday', { ...in9Days(), at: Date.now() - day }],
    ] as const) {
      await addCallNotice(t, {
        externalId,
        registrationCloses,
        documentUrls: [urlOf(externalId)],
        firstSeenAt: Date.now() - 500 * day,
      });
    }
    const pending = await t.action(internal.documents.listDocumentsToRead, {});
    expect(pending.map(({ url }) => url)).toEqual([
      urlOf('sooner'),
      urlOf('later'),
      urlOf('undated'),
      urlOf('closedYesterday'),
    ]);
  });

  test('leaves out a call first seen after its close; one seen open, closed since, stays', async () => {
    const t = convexTest(schema, modules);
    const urlOf = (id: string) => `${documentBase}/${id}/edital.pdf`;
    const closedYesterday = { ...in9Days(), at: Date.now() - day };
    for (const [externalId, registrationCloses, firstSeenAt] of [
      ['closedWhenFirstSeen', closedYesterday, Date.now()],
      ['seenOpenClosedSince', closedYesterday, Date.now() - 10 * day],
      ['open', in9Days(), Date.now()],
    ] as const) {
      await addCallNotice(t, {
        externalId,
        registrationCloses,
        firstSeenAt,
        documentUrls: [urlOf(externalId)],
      });
    }
    const pending = await t.action(internal.documents.listDocumentsToRead, {});
    expect(pending.map(({ url }) => url)).toEqual([urlOf('open'), urlOf('seenOpenClosedSince')]);
  });

  test('leaves out a call listed with a result already posted, though it prints no close', async () => {
    const t = convexTest(schema, modules);
    const urlOf = (id: string) => `${documentBase}/${id}/edital.pdf`;
    for (const [externalId, resultPosted] of [
      ['resultPosted', true],
      ['noResult', false],
    ] as const) {
      await addCallNotice(t, {
        externalId,
        registrationCloses: null,
        resultPosted,
        documentUrls: [urlOf(externalId)],
      });
    }
    const pending = await t.action(internal.documents.listDocumentsToRead, {});
    expect(pending.map(({ url }) => url)).toEqual([urlOf('noResult')]);
  });

  test('reads the stored flag, not the close: flagged rows stay out, rows from before the flag are judged by their close', async () => {
    const t = convexTest(schema, modules);
    const urlOf = (id: string) => `${documentBase}/${id}/edital.pdf`;
    const closedYesterday = { ...in9Days(), at: Date.now() - day };
    const stored = [
      ['flaggedOpenByClose', in9Days(), true],
      ['unflaggedClosedByClose', closedYesterday, false],
      ['legacyOpen', in9Days(), undefined],
      ['legacyClosed', closedYesterday, undefined],
    ] as const;
    for (const [externalId, registrationCloses, closedWhenFirstSeen] of stored) {
      const callNoticeId = await addCallNotice(t, {
        externalId,
        registrationCloses,
        documentUrls: [urlOf(externalId)],
      });
      await t.run((ctx) => ctx.db.patch(callNoticeId, { closedWhenFirstSeen }));
    }
    const pending = await t.action(internal.documents.listDocumentsToRead, {});
    expect(pending.map(({ url }) => url).sort()).toEqual(
      [urlOf('legacyOpen'), urlOf('unflaggedClosedByClose')].sort(),
    );
  });

  test('a call found closed comes back to the queue when its close is extended', async () => {
    const t = convexTest(schema, modules);
    const closedYesterday = { ...in9Days(), at: Date.now() - day };
    await addCallNotice(t, { registrationCloses: closedYesterday, documentUrls: [mainNotice] });
    expect(await t.action(internal.documents.listDocumentsToRead, {})).toEqual([]);
    await addCallNotice(t, { registrationCloses: in9Days(), documentUrls: [mainNotice] });
    expect(
      (await t.action(internal.documents.listDocumentsToRead, {})).map(({ url }) => url),
    ).toEqual([mainNotice]);
  });

  test('a document past the first batch checked is still listed, the read ones before it not', async () => {
    const t = convexTest(schema, modules);
    const urls = Array.from(
      { length: documentsCheckedPerQuery + 1 },
      (_, index) => `${documentBase}/edital-${index}.pdf`,
    );
    const callNoticeId = await addCallNotice(t, { documentUrls: urls });
    for (const url of urls.slice(0, documentsCheckedPerQuery)) {
      await t.mutation(internal.documents.recordDocumentRead, {
        callNoticeId,
        url,
        role: 'callNotice',
        markdown: '# Edital',
        markdownHash: 'a'.repeat(64),
        creditsUsed: 1,
      });
    }
    const pending = await t.action(internal.documents.listDocumentsToRead, {});
    expect(pending.map(({ url }) => url)).toEqual([urls.at(-1)]);
  });

  test('lists no document of a source whose robots.txt disallows its files', async () => {
    const t = convexTest(schema, modules);
    const sourceId = await t.run((ctx) => ctx.db.insert('sources', piedadePnabSource));
    await t.mutation(internal.callNotices.recordCallNotice, {
      sourceId,
      externalId: 'https://www.piedade.sp.gov.br/edital-termo-de-execucao-cultural-pnab---ciclo-2/',
      title: 'EDITAL TERMO DE EXECUÇÃO CULTURAL PNAB - CICLO 2',
      summary: null,
      officialUrl:
        'https://www.piedade.sp.gov.br/edital-termo-de-execucao-cultural-pnab---ciclo-2/',
      documentUrls: ['https://www.piedade.sp.gov.br/imgeditor/file/003%20-%20Edital.pdf'],
      registrationOpens: null,
      registrationCloses: null,
    });
    expect(await t.action(internal.documents.listDocumentsToRead, {})).toEqual([]);
  });

  test('stops at the credit ceiling and leaves the rest for the next run', async () => {
    const { t } = await withCallNotice();
    firecrawlAnswersPerUrl(() => scraped('# Edital', 2));
    expect(await readPending(t, 1)).toEqual({
      read: 1,
      failed: 0,
      creditsUsed: 2,
      left: 1,
      stoppedBy: 'creditCeiling',
    });
  });

  test('out of credits stops the run; the document is tried again by the next one', async () => {
    const { t } = await withCallNotice([mainNotice]);
    firecrawlAnswersPerUrl(() => new Response('{}', { status: 402 }));
    expect(await readPending(t)).toMatchObject({ read: 0, stoppedBy: 'outOfCredits' });
    expect(await documentsOf(t)).toMatchObject([{ status: 'failed', failure: 'outOfCredits' }]);

    firecrawlAnswersPerUrl(() => scraped('# Edital', 2));
    expect(await readPending(t)).toMatchObject({ read: 1 });
  });

  test('an answer without its cost stops the run: the ceiling could not hold', async () => {
    const { t } = await withCallNotice();
    const fetchMock = firecrawlAnswersPerUrl(
      () => new Response(JSON.stringify({ success: true, data: { markdown: '# Edital' } })),
    );
    expect(await readPending(t)).toMatchObject({ read: 1, left: 1, stoppedBy: 'unknownCost' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('a rate-limited read waits and retries once', async () => {
    const { t } = await withCallNotice([mainNotice]);
    let calls = 0;
    firecrawlAnswersPerUrl(() =>
      (calls += 1) === 1 ? new Response('{}', { status: 429 }) : scraped('# Edital', 2),
    );
    expect(await readPending(t)).toMatchObject({ read: 1, creditsUsed: 2 });
  });

  test("a provider error is stored as a code, never the provider's text", async () => {
    const { t } = await withCallNotice([mainNotice]);
    firecrawlAnswersPerUrl(() => new Response('internal detail of the provider', { status: 500 }));
    expect(await readPending(t)).toMatchObject({ failed: 1 });
    const [stored] = await documentsOf(t);
    expect(stored).toMatchObject({ status: 'failed', failure: 'providerError' });
    expect(JSON.stringify(stored)).not.toContain('internal detail');
  });

  test('a document with no text is paid once: it is not read again, it waits for review', async () => {
    const { t } = await withCallNotice([mainNotice]);
    const fetchMock = firecrawlAnswersPerUrl(() => scraped('  ', 3));
    expect(await readPending(t)).toMatchObject({ read: 0, failed: 1, creditsUsed: 3 });
    expect(await documentsOf(t)).toMatchObject([
      { status: 'failed', failure: 'noText', creditsUsed: 3 },
    ]);

    expect(await readPending(t)).toMatchObject({ read: 0, failed: 0, left: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('a document another run reserved is not paid twice, until its reservation is stale', async () => {
    const { t, callNoticeId } = await withCallNotice([mainNotice]);
    const document = { callNoticeId, url: mainNotice, role: 'callNotice' as const };
    expect(await t.mutation(internal.documents.reserveDocumentRead, document)).toBe(true);
    expect(await t.mutation(internal.documents.reserveDocumentRead, document)).toBe(false);
    expect(await t.action(internal.documents.listDocumentsToRead, {})).toEqual([]);

    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + documentReadingLeaseMs);
    expect(await t.mutation(internal.documents.reserveDocumentRead, document)).toBe(true);
  });
  describe('a read Firecrawl answers nearly empty (Estância: page headers only)', () => {
    const body =
      'Edital 022/2026 inscricoes ate 23/11/2026 valor de R$ 10.000,00 por projeto. '.repeat(5);
    const headersOnly = scraped('Ano VIII Prefeitura\n'.repeat(4), 4);

    test("takes the PDF's own text from the source's host instead", async () => {
      const t = convexTest(schema, modules);
      await t.run((ctx) => ctx.db.insert('sources', cearaMapasSource));
      await addCallNotice(t, { documentUrls: [mainNotice] });
      const fetchMock = firecrawlAndSourceAnswer(headersOnly, pdfWithText(Array(4).fill(body)));

      expect(await readPending(t)).toMatchObject({ read: 1, failed: 0, creditsUsed: 4 });
      const [stored] = await documentsOf(t);
      expect(stored).toMatchObject({ status: 'read', creditsUsed: 4 });
      const [text] = await textsOf(t);
      expect(text).toMatchObject({ callNoticeDocumentId: stored?._id });
      expect(text?.markdown).toContain('inscricoes ate 23/11/2026');
      expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([
        'https://api.firecrawl.dev/v2/scrape',
        mainNotice,
      ]);
    });

    test('is no text when the PDF has none either (a scan)', async () => {
      const t = convexTest(schema, modules);
      await t.run((ctx) => ctx.db.insert('sources', cearaMapasSource));
      await addCallNotice(t, { documentUrls: [mainNotice] });
      firecrawlAndSourceAnswer(headersOnly, pdfWithText(['p1', 'p2', 'p3', 'p4']));
      expect(await readPending(t)).toMatchObject({ read: 0, failed: 1 });
      expect(await documentsOf(t)).toMatchObject([{ status: 'failed', failure: 'noText' }]);
    });

    test('a source that answers only from Brazil is read from there, never fetched by us', async () => {
      const t = convexTest(schema, modules);
      await t.run((ctx) =>
        ctx.db.insert('sources', { ...cearaMapasSource, answersOnlyFromBrazil: true }),
      );
      await addCallNotice(t, { documentUrls: [mainNotice] });
      const fetchMock = firecrawlAndSourceAnswer(headersOnly, pdfWithText(Array(4).fill(body)));

      expect(await readPending(t)).toMatchObject({ read: 0, failed: 1 });
      expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([
        'https://api.firecrawl.dev/v2/scrape',
      ]);
      expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
        location: { country: 'BR' },
      });
    });

    test("never fetches a file off the source's own host", async () => {
      const { t } = await withCallNotice([mainNotice]);
      const fetchMock = firecrawlAndSourceAnswer(headersOnly, pdfWithText(Array(4).fill(body)));
      expect(await readPending(t)).toMatchObject({ read: 0, failed: 1 });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});

describe('readChosenCallNotices', () => {
  beforeEach(() => {
    vi.stubEnv('FIRECRAWL_API_KEY', 'fc-key');
    vi.stubGlobal('setTimeout', (resolve: () => void) => resolve());
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const closedLastMonth = () => ({ ...in9Days(), at: Date.now() - 30 * day });

  test('reads a chosen call closed when first seen, through the same rules, and no other', async () => {
    const t = convexTest(schema, modules);
    const chosen = await addCallNotice(t, { registrationCloses: closedLastMonth() });
    await addCallNotice(t, {
      externalId: 'notChosen',
      registrationCloses: closedLastMonth(),
      documentUrls: [`${documentBase}/notChosen/edital.pdf`],
    });
    const fetchMock = firecrawlAnswersPerUrl((url) => scraped(`# ${url}`, 2));
    expect(await t.action(internal.documents.listDocumentsToRead, {})).toEqual([]);

    const readChosen = () =>
      t.action(internal.documents.readChosenCallNotices, {
        callNoticeIds: [chosen],
        creditCeiling: 100,
      });
    expect(await readChosen()).toEqual({
      read: 2,
      failed: 0,
      creditsUsed: 4,
      left: 0,
      stoppedBy: 'nothingLeft',
    });
    expect((await documentsOf(t)).map(({ url, status }) => ({ url, status }))).toEqual([
      { url: mainNotice, status: 'read' },
      { url: categories, status: 'read' },
    ]);
    expect(await readChosen()).toMatchObject({ read: 0, left: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('stops at the credit ceiling, as the queue does', async () => {
    const t = convexTest(schema, modules);
    const chosen = await addCallNotice(t, { registrationCloses: closedLastMonth() });
    firecrawlAnswersPerUrl(() => scraped('# Edital', 2));
    expect(
      await t.action(internal.documents.readChosenCallNotices, {
        callNoticeIds: [chosen],
        creditCeiling: 1,
      }),
    ).toMatchObject({ read: 1, left: 1, stoppedBy: 'creditCeiling' });
  });

  test("reads nothing of a chosen call whose source's robots.txt disallows its files", async () => {
    const t = convexTest(schema, modules);
    const sourceId = await t.run((ctx) => ctx.db.insert('sources', piedadePnabSource));
    const { callNoticeId } = await t.mutation(internal.callNotices.recordCallNotice, {
      sourceId,
      externalId: 'https://www.piedade.sp.gov.br/edital-termo-de-execucao-cultural-pnab---ciclo-2/',
      title: 'EDITAL TERMO DE EXECUÇÃO CULTURAL PNAB - CICLO 2',
      summary: null,
      officialUrl:
        'https://www.piedade.sp.gov.br/edital-termo-de-execucao-cultural-pnab---ciclo-2/',
      documentUrls: ['https://www.piedade.sp.gov.br/imgeditor/file/003%20-%20Edital.pdf'],
      registrationOpens: null,
      registrationCloses: closedLastMonth(),
    });
    const fetchMock = firecrawlAnswersPerUrl(() => scraped('# Edital', 2));
    expect(
      await t.action(internal.documents.readChosenCallNotices, {
        callNoticeIds: [callNoticeId],
        creditCeiling: 100,
      }),
    ).toMatchObject({ read: 0, left: 0, stoppedBy: 'nothingLeft' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('takes at most 50 call notices a run', async () => {
    const t = convexTest(schema, modules);
    const chosen = await addCallNotice(t);
    await expect(
      t.action(internal.documents.readChosenCallNotices, {
        callNoticeIds: Array(chosenCallNoticesMax + 1).fill(chosen),
        creditCeiling: 100,
      }),
    ).rejects.toThrow(/callNoticeIds/);
  });
});

describe('callNoticeDocumentTexts', () => {
  const read = (callNoticeId: Id<'callNotices'>, markdown: string, url = mainNotice) => ({
    callNoticeId,
    url,
    role: 'callNotice' as const,
    markdown,
    markdownHash: 'a'.repeat(64),
    creditsUsed: 1,
  });

  test('a read keeps one text row, replaced by a new read of the same document', async () => {
    const { t, callNoticeId } = await withCallNotice([mainNotice]);
    await t.mutation(internal.documents.recordDocumentRead, read(callNoticeId, '# Primeira'));
    await t.mutation(internal.documents.recordDocumentRead, read(callNoticeId, '# Segunda'));
    const [document] = await documentsOf(t);
    expect(await textsOf(t)).toMatchObject([
      { callNoticeDocumentId: document?._id, markdown: '# Segunda' },
    ]);
  });

  test('a read replaced by a failure loses its text: a text row is always of a read', async () => {
    const { t, callNoticeId } = await withCallNotice([mainNotice]);
    await t.mutation(internal.documents.recordDocumentRead, read(callNoticeId, '# Edital'));
    await t.mutation(internal.documents.recordDocumentFailure, {
      callNoticeId,
      url: mainNotice,
      role: 'callNotice',
      failure: 'providerError',
      creditsUsed: null,
    });
    expect(await documentsOf(t)).toMatchObject([{ status: 'failed' }]);
    expect(await textsOf(t)).toEqual([]);
  });

  test('the reading queue never reads a text: it fits where one text would not', async () => {
    const t = convexTest({ schema, modules, transactionLimits: { bytesRead: 64 * 1024 } });
    const callNoticeId = await addCallNotice(t, { documentUrls: [mainNotice, categories] });
    await t.mutation(
      internal.documents.recordDocumentRead,
      read(callNoticeId, 'x'.repeat(300_000)),
    );
    expect(
      (await t.action(internal.documents.listDocumentsToRead, {})).map(({ url }) => url),
    ).toEqual([categories]);
    // The limit does catch a text read: extraction reads it, and fails under it.
    await expect(t.query(internal.extraction.getExtractionInput, { callNoticeId })).rejects.toThrow(
      /bytes/i,
    );
  });
});

describe('moveDocumentTextsToOwnTable', () => {
  /** A read row as stored before `callNoticeDocumentTexts`: the text on the row itself. */
  const unmigrated = (callNoticeId: Id<'callNotices'>, url: string, markdown: string) => ({
    callNoticeId,
    url,
    role: 'callNotice' as const,
    status: 'read' as const,
    markdown,
    markdownHash: 'a'.repeat(64),
    readAt: Date.now(),
    creditsUsed: 1,
  });
  const move = (t: ReturnType<typeof convexTest>) =>
    t.mutation(internal.documents.moveDocumentTextsToOwnTable, {});

  test('moves each text to its own row, unsets the old field, and is idempotent', async () => {
    const { t, callNoticeId } = await withCallNotice();
    await t.run(async (ctx) => {
      await ctx.db.insert('callNoticeDocuments', unmigrated(callNoticeId, mainNotice, '# A'));
      await ctx.db.insert('callNoticeDocuments', unmigrated(callNoticeId, categories, '# B'));
      await ctx.db.insert('callNoticeDocuments', {
        callNoticeId,
        url: `${documentBase}/anexo-ii-criterios.pdf`,
        role: 'criteria',
        status: 'failed',
        failedAt: Date.now(),
        failure: 'noText',
        creditsUsed: 1,
      });
    });
    expect(await move(t)).toEqual({ moved: 2, done: true });
    const documents = await documentsOf(t);
    for (const document of documents) expect(document).not.toHaveProperty('markdown');
    expect(await textsOf(t)).toMatchObject([
      { callNoticeDocumentId: documents[0]?._id, markdown: '# A' },
      { callNoticeDocumentId: documents[1]?._id, markdown: '# B' },
    ]);
    expect(await move(t)).toEqual({ moved: 0, done: true });
    expect(await textsOf(t)).toHaveLength(2);
  });

  test('moves a bounded batch per run and ends', async () => {
    const { t, callNoticeId } = await withCallNotice();
    const textBytes = 800_000;
    const rows = Math.ceil(documentTextsMovedPerRunBytes / textBytes) + 2;
    await t.run(async (ctx) => {
      for (let index = 0; index < rows; index++)
        await ctx.db.insert(
          'callNoticeDocuments',
          unmigrated(callNoticeId, `${documentBase}/edital-${index}.pdf`, 'x'.repeat(textBytes)),
        );
    });
    const runs = [];
    for (let run = 0; run < rows; run++) {
      const result = await move(t);
      runs.push(result);
      if (result.done) break;
    }
    const firstBatch = Math.ceil(documentTextsMovedPerRunBytes / textBytes);
    expect(runs).toEqual([
      { moved: firstBatch, done: false },
      { moved: rows - firstBatch, done: true },
    ]);
    expect(await textsOf(t)).toHaveLength(rows);
  });

  test('extraction reads an unmigrated row from the row itself, a migrated one from its table', async () => {
    const { t, callNoticeId } = await withCallNotice();
    await t.run((ctx) =>
      ctx.db.insert('callNoticeDocuments', unmigrated(callNoticeId, mainNotice, '# Antigo')),
    );
    await t.mutation(internal.documents.recordDocumentRead, {
      callNoticeId,
      url: categories,
      role: 'categories',
      markdown: '# Novo',
      markdownHash: 'b'.repeat(64),
      creditsUsed: 1,
    });
    const input = async () =>
      (await t.query(internal.extraction.getExtractionInput, { callNoticeId })).map(
        ({ url, markdown }) => ({ url, markdown }),
      );
    const expected = [
      { url: categories, markdown: '# Novo' },
      { url: mainNotice, markdown: '# Antigo' },
    ];
    expect(await input()).toEqual(expected);
    await move(t);
    expect(await input()).toEqual(expected);
  });
});
