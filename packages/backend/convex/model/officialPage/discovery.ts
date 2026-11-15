import { CallNoticeDocumentUrlSchema } from '@bratura/shared/entities/call-notice/fragments/listing/fields';
import type { Source } from '@bratura/shared/entities/source/entity';
import { callNoticeDocumentRole } from '../callNoticeDocuments/selection';
import { fetchPageHtml, isFetchableFromListing } from './client';
import { linksOfHtml, type PageLink } from './html';
import type { OfficialPageCall } from './payload';

type OfficialPageSource = Extract<Source, { kind: 'officialPage' }>;

/** Between two call pages of one site: a public office's server, not a crawl. */
const callPageSpacingMs = 1_000;

const plainText = (text: string) =>
  text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ');

/**
 * A call whose page or listing already posts results is past its registration (Bahia, 2026-11-15:
 * 25 of 28 pages; the 3 without were the newest, 2 open). It is not recorded: reading it would pay
 * for a closed call.
 */
const publishedResult = /resultado|homologa|classificad|selecionad|suplente/;

function readableUrl(url: string) {
  try {
    return decodeURI(url);
  } catch {
    return url;
  }
}

const hasPublishedResult = (documents: PageLink[]) =>
  documents.some(({ url, label }) =>
    publishedResult.test(plainText(`${label} ${readableUrl(url)}`)),
  );

function documentLinksOf(links: PageLink[], documentUrlParts: string[]) {
  return links.filter(
    ({ url }) =>
      documentUrlParts.some((part) => url.includes(part)) &&
      CallNoticeDocumentUrlSchema.safeParse(url).success,
  );
}

/**
 * A call numbered in a past year ("Edital 03/2024") is closed by now: listings keep years of them
 * (Minas Gerais PNAB, Maranhão), and each would cost a read.
 */
function isNumberedInPastYear(label: string, now: number) {
  const year = Number(callNumberOf(label)?.split('/')[1]);
  return Number.isInteger(year) && year < new Date(now).getUTCFullYear();
}

/** Two hops: the listing's call pages, each read for its own documents. */
export async function callsOfCallPages(
  source: OfficialPageSource,
  callPageUrlParts: string[],
  fetchHtml: (url: string) => Promise<string> = fetchPageHtml,
  pause: () => Promise<void> = () => new Promise((done) => setTimeout(done, callPageSpacingMs)),
  now = Date.now(),
): Promise<OfficialPageCall[]> {
  const listing = linksOfHtml(await fetchHtml(source.listingUrl), source.listingUrl);
  const callPages = listing.filter(
    ({ url, label }) =>
      label &&
      !isNumberedInPastYear(label, now) &&
      url !== source.listingUrl &&
      callPageUrlParts.some((part) => url.includes(part)) &&
      isFetchableFromListing(url, source.listingUrl) &&
      !source.documentUrlParts.some((part) => url.includes(part)),
  );
  const calls: OfficialPageCall[] = [];
  for (const [index, { url, label }] of callPages.entries()) {
    if (index > 0) await pause();
    let page: PageLink[];
    try {
      page = linksOfHtml(await fetchHtml(url), url);
    } catch (error) {
      console.warn('Call page not read', url, String(error));
      continue;
    }
    const documents = documentLinksOf(page, source.documentUrlParts);
    if (documents.length === 0 || hasPublishedResult(documents)) continue;
    calls.push({ externalId: url, title: label, officialUrl: url, documents });
  }
  return calls;
}

/** Kind words a call number follows, most specific first ("Edital FEC 02/2026" is FEC). */
const callKinds = ['fec', 'pnab', 'chamamento', 'selecao', 'chamada', 'pregao', 'edital'];

/**
 * The call a document's link names ("Edital FEC 02/2026 - Rainha Conga" → `fec 2/2026`), or `null`
 * when it names none (an annex: "Anexo I - Categorias", which follows its call on the listing).
 */
export function callNumberOf(label: string): string | null {
  const text = plainText(label);
  // Not a date: "31/07/25" is no call number, so no digit or `/` may touch the pair.
  for (const match of text.matchAll(/(?<![\d/.])(\d{1,3})\s*[/.-]\s*(20\d{2}|\d{2})(?![\d/.])/g)) {
    const before = text.slice(Math.max(0, match.index - 50), match.index);
    const kind = callKinds.find((word) => before.includes(word));
    if (!kind) continue;
    const year = match[2]!.length === 2 ? `20${match[2]}` : match[2];
    return `${kind} ${Number(match[1])}/${year}`;
  }
  return null;
}

/** "Retificado em 10/11/26" → a sortable number; 0 when the link gives no version date. */
function versionDateOf(label: string) {
  const match = /(retificad|alterad|atualizad)\w*\D{0,6}(\d{1,2})\/(\d{1,2})\/(\d{2,4})/.exec(
    plainText(label),
  );
  if (!match) return 0;
  const year = match[4]!.length === 2 ? 2000 + Number(match[4]) : Number(match[4]);
  return year * 10_000 + Number(match[3]) * 100 + Number(match[2]);
}

/**
 * One call's documents with only its newest notice: Minas Gerais lists the original and every
 * rectified version side by side, and each is the whole notice (one read instead of five).
 */
function withNewestNoticeOnly(documents: PageLink[]) {
  const notices = documents.filter(
    ({ url, label }) => callNoticeDocumentRole(url, label) === 'callNotice',
  );
  if (notices.length < 2) return documents;
  const newest = notices.reduce((best, notice) =>
    versionDateOf(notice.label) > versionDateOf(best.label) ? notice : best,
  );
  return documents.filter((document) => !notices.includes(document) || document === newest);
}

/**
 * One hop: the listing's documents, grouped by the call their link names, an unnumbered one going
 * with the call listed just before it. Procurement (`pregão`) is not a culture call.
 */
export function callsOfDocumentsOnListing(
  source: OfficialPageSource,
  html: string,
  now = Date.now(),
): OfficialPageCall[] {
  const documents = documentLinksOf(linksOfHtml(html, source.listingUrl), source.documentUrlParts);
  const byCall = new Map<string, PageLink[]>();
  let current: string | null = null;
  for (const document of documents) {
    current = callNumberOf(document.label) ?? current;
    if (current) byCall.set(current, [...(byCall.get(current) ?? []), document]);
  }
  return [...byCall].flatMap(([callNumber, callDocuments]) => {
    if (callNumber.startsWith('pregao ') || hasPublishedResult(callDocuments)) return [];
    if (isNumberedInPastYear(callNumber.replace(/^\S+ /, 'edital '), now)) return [];
    const kept = withNewestNoticeOnly(callDocuments);
    const notice = kept.find(
      ({ url, label }) => callNoticeDocumentRole(url, label) === 'callNotice',
    );
    if (!notice) return [];
    return [
      {
        externalId: callNumber,
        title: notice.label,
        officialUrl: source.listingUrl,
        documents: kept,
      },
    ];
  });
}

/** Every call an official page lists today, as raw entries the reader's schema parses. */
export async function fetchOfficialPageCalls(source: OfficialPageSource): Promise<unknown[]> {
  if (source.discovery.hops === 'callPage') {
    return await callsOfCallPages(source, source.discovery.callPageUrlParts);
  }
  return callsOfDocumentsOnListing(source, await fetchPageHtml(source.listingUrl));
}
