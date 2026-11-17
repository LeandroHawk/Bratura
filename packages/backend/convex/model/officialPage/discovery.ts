import { CallNoticeDocumentUrlSchema } from '@bratura/shared/entities/call-notice/fragments/listing/fields';
import type { OfficialPageSource } from '@bratura/shared/entities/source/kinds/official-page/variant';
import { plainText } from '../../lib/text';
import { callNoticeDocumentRole, fileNameOf, postsResult } from '../callNoticeDocuments/selection';
import { firecrawlRequestSpacingMs } from '../firecrawl/client';
import { isOnSourceHost } from '../sourceHost/fetchOnSourceHost';
import { fetchPageHtml, type FetchedPage } from './client';
import { headingOfHtml, linksOfHtml, sectionsOfHtml, type PageLink } from './html';
import type { OfficialPageCall } from './payload';

/** An official page whose listing links one page per call. */
type CallPageSource = OfficialPageSource & { discovery: { hops: 'callPage' } };

/** An official page whose listing links each call's documents under a heading naming it. */
type HeadingsSource = OfficialPageSource & { discovery: { hops: 'documentsUnderHeadings' } };

const currentYear = () => new Date().getUTCFullYear();

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
  callNumber !== null && callNumber.year < currentYear() - 1;

/** A link text or file name that names such a call. */
const namesACallBeforeLastYear = (name: string) => isNumberedBeforeLastYear(callNumberOf(name));

/**
 * `lpg-edital-012-2023.pdf` as `lpg edital 012/2023`, a label `callNumberOf` reads. A chain stays
 * one (`06-11-008-2026` → `06/11/008/2026`), which `callNumberOf` refuses: no "06/11" as 2011.
 */
export const fileNameAsLabel = (url: string) =>
  fileNameOf(url)
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/(?<=\d)[\s_-]+(?=\d)/g, '/')
    .replace(/[_-]+/g, ' ');

/** Whether a document is a call's notice, by its link text and file name. */
const isNotice = ({ url, label }: PageLink) => callNoticeDocumentRole(url, label) === 'callNotice';

/** Whether every year a text names (`2025`, `05/2019`, `2015_Edital`) is before `year`. */
function namesOnlyYearsBefore(text: string, year: number) {
  const years = [...text.matchAll(/(?<!\d)20\d{2}(?!\d)/g)].map(([named]) => Number(named));
  return years.length > 0 && Math.max(...years) < year;
}

/**
 * A call whose title names no year can still hold only old notices (Paraná, 2026-11-15: "Edital
 * Bandas e Fanfarras" is `lpg-edital-012-2023.pdf`; Spcine, 2026-11-17: `2015_Edital_Linha_1.pdf`
 * under "LINHA 1"). Every notice naming, by text and file name, only years before last year drops
 * it; one current notice keeps it. Last year's stay, as numbered calls do.
 */
function noticesNameOnlyYearsBeforeLastYear(documents: PageLink[]) {
  const notices = documents.filter(isNotice);
  const lastYear = currentYear() - 1;
  return (
    notices.length > 0 &&
    notices.every(({ url, label }) =>
      namesOnlyYearsBefore(`${label} ${fileNameAsLabel(url)}`, lastYear),
    )
  );
}

/**
 * A listing link that names no call, only an action (2026-11-15: Salvador links every call page as
 * "Clique aqui!", Estância as "Acessar"). The call page's own heading names the call instead, or,
 * with no `<h1>` (Estância), a notice whose name carries a call number ("EDITAL 022/2026 – …").
 */
const namesNoCall = (label: string) => /^(clique aqui|acessar)[\s!.]*$/.test(plainText(label));

/** Two hops: the listing's call pages, each read for its own documents. */
export async function callsOfCallPages(source: CallPageSource): Promise<OfficialPageCall[]> {
  // Through Firecrawl, call pages keep to its rate limit; on the site itself, a second apart.
  const spacingMs = source.answersOnlyFromBrazil ? firecrawlRequestSpacingMs : callPageSpacingMs;
  const { html, url: listingUrl } = await fetchPageHtml(
    source.listingUrl,
    source.listingUrl,
    source,
  );
  const listing = linksOfHtml(html, listingUrl);
  /**
   * A document the listing links too is the site's frame, not the call's (Funarte, 2026-11-15:
   * every page links an internal "Edital No. 409/2025"). Without this, it is each call's notice.
   */
  const frameDocumentUrls = new Set(
    documentLinksOf(listing, source.documentUrlParts).map(({ url }) => url),
  );
  const callPages = listing.filter(
    ({ url, label }) =>
      label &&
      !namesACallBeforeLastYear(label) &&
      url !== source.listingUrl &&
      url !== listingUrl &&
      source.discovery.callPageUrlParts.some((part) => url.includes(part)) &&
      isOnSourceHost(url, source.listingUrl) &&
      !source.documentUrlParts.some((part) => url.includes(part)),
  );
  const calls: OfficialPageCall[] = [];
  const startedAt = Date.now();
  for (const [index, { url, label }] of callPages.entries()) {
    if (Date.now() - startedAt > callPagesBudgetMs) {
      console.warn('Call pages left unread for lack of time', callPages.length - index);
      break;
    }
    if (index > 0) await new Promise((done) => setTimeout(done, spacingMs));
    let page: PageLink[];
    let heading: string;
    try {
      const fetched = await fetchPageHtml(url, source.listingUrl, source);
      page = linksOfHtml(fetched.html, fetched.url);
      heading = headingOfHtml(fetched.html);
    } catch (error) {
      console.warn('Call page not read', url, String(error));
      continue;
    }
    const documents = documentLinksOf(page, source.documentUrlParts).filter(
      ({ url }) => !frameDocumentUrls.has(url),
    );
    const kept = callDocumentsWorthRecording(documents);
    if (!kept) continue;
    const numberedNotice = kept.find(
      (document) => isNotice(document) && callNumberOf(document.label),
    );
    const title = namesNoCall(label) ? heading || numberedNotice?.label : label;
    if (!title) continue;
    calls.push({ externalId: url, title, officialUrl: url, documents: kept });
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
 * rectified version side by side, Salvador one notice as PDF and `.docx`, and each is the whole
 * notice (one read instead of five). Without a version date, the first listed stays.
 */
function withNewestNoticeOnly(documents: PageLink[]) {
  const notices = documents.filter(isNotice);
  if (notices.length < 2) return documents;
  const newest = notices.reduce((best, notice) =>
    versionDateOf(notice.label) > versionDateOf(best.label) ? notice : best,
  );
  return documents.filter((document) => !notices.includes(document) || document === newest);
}

/**
 * A call's documents worth recording, whatever shape the page has: some, no result posted, not
 * every notice from before last year. Its newest notice only; `null` when not worth it.
 */
function callDocumentsWorthRecording(documents: PageLink[]) {
  if (documents.length === 0 || hasPublishedResult(documents)) return null;
  if (noticesNameOnlyYearsBeforeLastYear(documents)) return null;
  return withNewestNoticeOnly(documents);
}

/**
 * On a listing a notice is what makes documents a call (Ponta Grossa, 2026-11-15: two decrees
 * under "Legislação"); a call page is one by its URL, recorded without one for the admin review.
 */
function listedCallDocuments(documents: PageLink[]) {
  const kept = callDocumentsWorthRecording(documents);
  const notice = kept?.find(isNotice);
  return kept && notice ? { kept, notice } : null;
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
    const recorded = listedCallDocuments(callDocuments);
    if (!recorded) return [];
    return [
      {
        externalId: key,
        title: recorded.notice.label,
        officialUrl: source.listingUrl,
        documents: recorded.kept,
      },
    ];
  });
}

/**
 * Whether a heading titles a past call. Numbered, by the numbered rule (last year's stay: a
 * credenciamento 08/2025 is open to 2049). Unnumbered, it names an edition, past when every year
 * it names is ("CICLO NATALINO 2025", Spcine's "05/2019 | EDITAL…"): Recife (2026-11-17) lists 196
 * calls since 2019 and Spcine 57 since 2015, with no date on the page, each kept one a read.
 */
function headingNamesAPastCall(heading: string) {
  const callNumber = callNumberOf(heading);
  if (callNumber) return isNumberedBeforeLastYear(callNumber);
  return namesOnlyYearsBefore(heading, currentYear());
}

/** An accordion's indicator glyph before the title ("▸ 07/2026 | …"). */
const withoutLeadingSymbols = (heading: string) => heading.replace(/^[^\p{L}\p{N}]+/u, '');

/**
 * One hop: the listing's documents, each with the heading above it, which names its call and is
 * its id at the source. A heading with no notice under it (the page's own title) is no call.
 */
export function callsOfDocumentsUnderHeadings(
  source: HeadingsSource,
  { html, url }: FetchedPage,
): OfficialPageCall[] {
  const { headingClass } = source.discovery;
  return sectionsOfHtml(html, url, headingClass).flatMap(({ heading: rawHeading, links }) => {
    const heading = withoutLeadingSymbols(rawHeading);
    if (!heading || headingNamesAPastCall(heading)) return [];
    const recorded = listedCallDocuments(documentLinksOf(links, source.documentUrlParts));
    if (!recorded) return [];
    return [
      {
        externalId: heading,
        title: heading,
        officialUrl: source.listingUrl,
        documents: recorded.kept,
      },
    ];
  });
}

/** Every call an official page lists today, as raw entries the reader's schema parses. */
export async function fetchOfficialPageCalls(source: OfficialPageSource): Promise<unknown[]> {
  const { discovery } = source;
  if (discovery.hops === 'callPage') return await callsOfCallPages({ ...source, discovery });
  const listing = await fetchPageHtml(source.listingUrl, source.listingUrl, source);
  if (discovery.hops === 'documentsUnderHeadings') {
    return callsOfDocumentsUnderHeadings({ ...source, discovery }, listing);
  }
  return callsOfDocumentsOnListing(source, listing);
}
