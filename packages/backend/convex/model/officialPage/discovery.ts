import { CallNoticeDocumentUrlSchema } from '@bratura/shared/entities/call-notice/fragments/listing/fields';
import type { OfficialPageSource } from '@bratura/shared/entities/source/kinds/official-page/variant';
import { plainText } from '../../lib/text';
import { callNoticeDocumentRole, fileNameOf, postsResult } from '../callNoticeDocuments/selection';
import { fetchPageHtml, isFetchableFromListing, type FetchedPage } from './client';
import { linksOfHtml, type PageLink } from './html';
import type { OfficialPageCall } from './payload';

/** An official page whose listing links one page per call. */
type CallPageSource = OfficialPageSource & { discovery: { hops: 'callPage' } };

/** Between two call pages of one site: a public office's server, not a crawl. */
const callPageSpacingMs = 1_000;

/**
 * No call page is opened past this: a page can take 2 min (4 fetches × 30 s), so the listing,
 * this and the last page stay under the action's 10 min. The calls found so far are kept.
 */
const callPagesBudgetMs = 5 * 60_000;

/**
 * A call whose page or listing already posts results is past its registration (Bahia, 2026-11-15:
 * 25 of 28 pages; the 3 without were the newest, 2 open). It is not recorded: reading it would pay
 * for a closed call.
 */
const hasPublishedResult = (documents: PageLink[]) =>
  documents.some(({ url, label }) => postsResult(url, label));

function documentLinksOf(links: PageLink[], documentUrlParts: string[]) {
  return links.filter(
    ({ url }) =>
      documentUrlParts.some((part) => url.includes(part)) &&
      CallNoticeDocumentUrlSchema.safeParse(url).success,
  );
}

/**
 * A call numbered before last year ("Edital 03/2024" in 2026) is closed: listings keep years of
 * them, each a read. Not last year's: 4 of 28 numbered calls in the dev DB close in a later year.
 */
const isNumberedBeforeLastYear = (callNumber: CallNumber | null) =>
  callNumber !== null && callNumber.year < new Date().getUTCFullYear() - 1;

/**
 * `lpg-edital-012-2023.pdf` as `lpg edital 012/2023`, a label `callNumberOf` reads. A chain stays
 * one (`06-11-008-2026` → `06/11/008/2026`), which `callNumberOf` refuses: no "06/11" as 2011.
 */
export const fileNameAsLabel = (url: string) =>
  fileNameOf(url)
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/(?<=\d)[\s_-]+(?=\d)/g, '/')
    .replace(/[_-]+/g, ' ');

/**
 * A call page whose title names no year can still hold only old notices (Paraná, 2026-11-15:
 * "Edital Bandas e Fanfarras" is `lpg-edital-012-2023.pdf`). One current notice keeps the page.
 */
function noticesAreNumberedBeforeLastYear(documents: PageLink[]) {
  const notices = documents.filter(
    ({ url, label }) => callNoticeDocumentRole(url, label) === 'callNotice',
  );
  return (
    notices.length > 0 &&
    notices.every(({ url, label }) =>
      [label, fileNameAsLabel(url)].some((name) => isNumberedBeforeLastYear(callNumberOf(name))),
    )
  );
}

/** Two hops: the listing's call pages, each read for its own documents. */
export async function callsOfCallPages(source: CallPageSource): Promise<OfficialPageCall[]> {
  const { html, url: listingUrl } = await fetchPageHtml(source.listingUrl);
  const listing = linksOfHtml(html, listingUrl);
  const callPages = listing.filter(
    ({ url, label }) =>
      label &&
      !isNumberedBeforeLastYear(callNumberOf(label)) &&
      url !== source.listingUrl &&
      url !== listingUrl &&
      source.discovery.callPageUrlParts.some((part) => url.includes(part)) &&
      isFetchableFromListing(url, source.listingUrl) &&
      !source.documentUrlParts.some((part) => url.includes(part)),
  );
  const calls: OfficialPageCall[] = [];
  const startedAt = Date.now();
  for (const [index, { url, label }] of callPages.entries()) {
    if (Date.now() - startedAt > callPagesBudgetMs) {
      console.warn('Call pages left unread for lack of time', callPages.length - index);
      break;
    }
    if (index > 0) await new Promise((done) => setTimeout(done, callPageSpacingMs));
    let page: PageLink[];
    try {
      const fetched = await fetchPageHtml(url);
      page = linksOfHtml(fetched.html, fetched.url);
    } catch (error) {
      console.warn('Call page not read', url, String(error));
      continue;
    }
    const documents = documentLinksOf(page, source.documentUrlParts);
    if (
      documents.length === 0 ||
      hasPublishedResult(documents) ||
      noticesAreNumberedBeforeLastYear(documents)
    ) {
      continue;
    }
    calls.push({ externalId: url, title: label, officialUrl: url, documents });
  }
  return calls;
}

/** Kind words a call number follows, most specific first ("Edital FEC 02/2026" is FEC). */
const callKinds = ['fec', 'pnab', 'chamamento', 'selecao', 'chamada', 'pregao', 'edital'] as const;

/** Which call a link names: "Edital FEC 02/2026" is `{ kind: 'fec', number: 2, year: 2026 }`. */
export type CallNumber = { kind: (typeof callKinds)[number]; number: number; year: number };

/** One key per call on a listing (`fec 2/2026`): the call notice's id at the source. */
const keyOfCallNumber = ({ kind, number, year }: CallNumber) => `${kind} ${number}/${year}`;

/**
 * The call a document's link names, or `null` when it names none (an annex: "Anexo I -
 * Categorias", which follows its call on the listing).
 */
export function callNumberOf(label: string): CallNumber | null {
  const text = plainText(label);
  // Not a date: "31/07/25" is no call number, so no digit or `/` may touch the pair.
  for (const match of text.matchAll(/(?<![\d/.])(\d{1,3})\s*[/.-]\s*(20\d{2}|\d{2})(?![\d/.])/g)) {
    const before = text.slice(Math.max(0, match.index - 50), match.index);
    const kind = callKinds.find((word) => before.includes(word));
    if (!kind) continue;
    const year = Number(match[2]!.length === 2 ? `20${match[2]}` : match[2]);
    return { kind, number: Number(match[1]), year };
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
  { html, url }: FetchedPage,
): OfficialPageCall[] {
  const documents = documentLinksOf(linksOfHtml(html, url), source.documentUrlParts);
  const byCall = new Map<string, { callNumber: CallNumber; documents: PageLink[] }>();
  let current: CallNumber | null = null;
  for (const document of documents) {
    current = callNumberOf(document.label) ?? current;
    if (!current) continue;
    const key = keyOfCallNumber(current);
    byCall.set(key, {
      callNumber: current,
      documents: [...(byCall.get(key)?.documents ?? []), document],
    });
  }
  return [...byCall].flatMap(([key, { callNumber, documents: callDocuments }]) => {
    if (callNumber.kind === 'pregao' || isNumberedBeforeLastYear(callNumber)) return [];
    if (hasPublishedResult(callDocuments)) return [];
    const kept = withNewestNoticeOnly(callDocuments);
    const notice = kept.find(
      ({ url, label }) => callNoticeDocumentRole(url, label) === 'callNotice',
    );
    if (!notice) return [];
    return [
      { externalId: key, title: notice.label, officialUrl: source.listingUrl, documents: kept },
    ];
  });
}

/** Every call an official page lists today, as raw entries the reader's schema parses. */
export async function fetchOfficialPageCalls(source: OfficialPageSource): Promise<unknown[]> {
  const { discovery } = source;
  if (discovery.hops === 'callPage') return await callsOfCallPages({ ...source, discovery });
  return callsOfDocumentsOnListing(source, await fetchPageHtml(source.listingUrl));
}
