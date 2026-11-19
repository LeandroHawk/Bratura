import { instantFromPlainDateTimeInZone } from '@bratura/shared/primitives/code/calendar/calendar';
import { CallNoticeDocumentUrlSchema } from '@bratura/shared/entities/call-notice/fragments/listing/fields';
import type { OfficialPageSource } from '@bratura/shared/entities/source/kinds/official-page/variant';
import { plainText } from '../../lib/text';
import { callNoticeDocumentRole, fileNameOf, postsResult } from '../callNoticeDocuments/selection';
import { firecrawlRequestSpacingMs } from '../firecrawl/client';
import { isOnSourceHost } from '../sourceHost/fetchOnSourceHost';
import { fetchListingJson, fetchPageHtml, type FetchedPage } from './client';
import {
  folderLinksOfHtml,
  headingOfHtml,
  linksOfHtml,
  onePerUrl,
  sectionsOfHtml,
  textOfClass,
  textOfHtml,
  titleOfHtml,
  type PageLink,
} from './html';
import { JsonListedCallSchema, type OfficialPageCall } from './payload';
import { registrationClosePrintedIn } from './registrationClose';

/** Whether a call's title holds one of the source's `callTitleParts`, when it has any. */
const titleIsKept = ({ callTitleParts }: OfficialPageSource, title: string) =>
  !callTitleParts || callTitleParts.some((part) => plainText(title).includes(plainText(part)));

/** Whether `url` is inside the folder `folderUrl` names (`…/edital-x/anexos` in `…/edital-x`). */
const isBelowFolder = (url: string, folderUrl: string) =>
  url !== folderUrl && url.startsWith(`${folderUrl.replace(/\/$/, '')}/`);

/** An official page whose listing links one page per call. */
type CallPageSource = OfficialPageSource & { discovery: { hops: 'callPage' } };

type CallPagesListedAsJson = NonNullable<CallPageSource['discovery']['callPagesListedAsJson']>;

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

/**
 * A credenciamento stays open to new entrants while it is valid (Lei 14.133, art. 79): the list of
 * those accredited so far closes nothing (Museu do Índio, 2026-11-18: Edital 90008/2025, open for 5
 * years, "lista 1" posted).
 */
const staysOpenAfterAResult = (title: string) => /\bcredenciamento\b/.test(plainText(title));

/**
 * A Plone file's page (`…/edital.pdf/view`, Funesc and gov.br, 2026-11-17) is HTML around the file;
 * the file itself answers at the same URL without `/view`.
 */
const withoutFileViewPage = (link: PageLink): PageLink => {
  const url = new URL(link.url);
  if (url.search || !/\/[^/]+\.[a-z0-9]+\/view$/i.test(url.pathname)) return link;
  url.pathname = url.pathname.slice(0, -'/view'.length);
  return { ...link, url: url.href };
};

/**
 * The PNAB platform (BA, PI, AM, AP, TO, Macapá; 2026-11-17) links every file as "Baixar", at
 * `/lerarquivo/<base64 path>/<base64 title>`: the title it carries names the file ("ANEXO 1 -
 * FORMULÁRIO…", "RESULTADO FINAL…"), so it is the label. Without it no annex or result is known.
 */
function withTitleItsUrlCarries(link: PageLink): PageLink {
  const encoded = /^\/lerarquivo\/[^/]+\/([A-Za-z0-9+/=]+)$/.exec(new URL(link.url).pathname)?.[1];
  if (!encoded) return link;
  try {
    const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
    const title = new TextDecoder('utf-8', { fatal: true }).decode(bytes).trim();
    return title ? { ...link, label: title } : link;
  } catch {
    return link;
  }
}

/** A page's document links, each file once: a page may link it both as the file and its `/view`. */
function documentLinksOf(links: PageLink[], documentUrlParts: string[]) {
  return onePerUrl(links.map((link) => withTitleItsUrlCarries(withoutFileViewPage(link)))).filter(
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

/**
 * Whether a title (a heading, a call page's link text) names a past call. Numbered, by the
 * numbered rule (last year's stay: a credenciamento 08/2025 is open to 2049). Unnumbered, it names
 * an edition, past when every year it names is ("CICLO NATALINO 2025", Spcine's "05/2019 |
 * EDITAL…", Rio Branco's "Fundo Municipal de Cultura 2023 - Arte"): Recife (2026-11-17) lists 196
 * calls since 2019 and Spcine 57 since 2015, with no date on the page, each kept one a read.
 */
function titleNamesAPastCall(title: string) {
  const callNumber = callNumberOf(title);
  if (callNumber) return isNumberedBeforeLastYear(callNumber);
  return namesOnlyYearsBefore(title, currentYear());
}

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
 * "Clique aqui!", Estância as "Acessar"; 2026-11-18: Balsas "Mais informações", Coronel Fabriciano
 * "Ver edital", Itaperuna "Ver edital e inscrever-se"). The call page's own heading names the call
 * instead, or, with no `<h1>` (Estância), a notice whose name carries a call number.
 */
const namesNoCall = (label: string) =>
  /^(clique aqui|acessar|mais informacoes|ver edital( e inscrever-se)?)[\s!.]*$/.test(
    plainText(label),
  );

/**
 * A listing card saying registration is over (2026-11-18: Secult-RN Mais Cultura "Inscrições
 * encerradas" on all 47 PNAB cards, FCP-PA "Situação: Encerrada"): its page is never opened.
 */
const saysRegistrationClosed = (label: string) =>
  /\b(inscricoes encerradas|situacao: encerrada)\b/.test(plainText(label));

/**
 * A call page whose own text is the notice (Badesc, 2026-11-17: the rules in the post, applications
 * on Google Forms, no file). The page goes first as its notice when no linked file is one and its
 * title names a call; a menu page under the same path ("AGENDAMENTO") does not.
 */
function withPageAsNotice(documents: PageLink[], page: PageLink) {
  if (documents.some(isNotice) || !isNotice(page)) return documents;
  if (!CallNoticeDocumentUrlSchema.safeParse(page.url).success) return documents;
  return [page, ...documents];
}

/** "10/11/26", "17/10/2026": the first day/month/year a text writes, or `null`. */
function plainDateOf(text: string) {
  const match = /(?<![\d/])(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})(?![\d/])/.exec(text);
  if (!match) return null;
  const year = match[3]!.length === 2 ? 2000 + Number(match[3]) : Number(match[3]);
  return { year, month: Number(match[2]), day: Number(match[1]) };
}

const yearMs = 365 * 24 * 60 * 60_000;

/**
 * Whether a call page's publication date ("17/10/2026 04:42") is over a year old: Porto Alegre
 * (2026-11-17) lists 16 news back to 2023, 11 of them past calls with no year in the title, each a
 * read. A rolling year, not the calendar's: a call posted in December stays in January. A page
 * with no readable date is kept: a changed layout must not drop them all.
 */
function publishedOverAYearAgo(html: string, source: CallPageSource, publishedAtClass: string) {
  const date = plainDateOf(textOfClass(html, publishedAtClass));
  if (!date) return false;
  const publishedAt = instantFromPlainDateTimeInZone(
    { ...date, hour: 0, minute: 0, second: 0 },
    source.timeZone,
  );
  return Date.now() - publishedAt > yearMs;
}

/**
 * An `http:` link to the source's own host, as `https:`: Sesi SP (2026-11-17) links every call page
 * as `http://www.sesisp.org.br/…` and redirects it. Only `https:` is fetched, so without it no call.
 */
function withHttpsOnHost(link: PageLink, sourceUrl: string): PageLink {
  const url = new URL(link.url);
  if (url.protocol !== 'http:') return link;
  url.protocol = 'https:';
  return isOnSourceHost(url.href, sourceUrl) ? { ...link, url: url.href } : link;
}

/**
 * A link text cut short with "..." (FJA-RN, 2026-11-18: "CHAMADA PÚBLICA Nº 002_2026 ARTISTAS,
 * GR...") as the whole name its URL's last segment spells, when that segment starts with the text.
 */
function withUntruncatedLabel(link: PageLink): PageLink {
  const shown = /^(.*\S)\s*(\.{3}|…)$/.exec(link.label)?.[1];
  if (!shown) return link;
  // The link text is already spaced (`plainLabel`); a folder name can hold two spaces in a row.
  const segment = fileNameOf(link.url.replace(/\/$/, '')).replace(/\s+/g, ' ').trim();
  return plainText(segment).startsWith(plainText(shown)) ? { ...link, label: segment } : link;
}

/**
 * A JSON listing's calls as the links an HTML listing would print (`callPagesListedAsJson`), each
 * title spaced as a link text is: an item with no id or no text title is skipped.
 */
function callPageLinksOfJsonListing(
  items: unknown[],
  { callPagePath, titleField }: CallPagesListedAsJson,
  listingUrl: string,
): PageLink[] {
  return items.flatMap((item) => {
    const listed = JsonListedCallSchema.safeParse(item);
    const title: unknown = listed.success ? listed.data[titleField] : undefined;
    if (!listed.success || typeof title !== 'string') return [];
    const path = callPagePath.replace('{id}', encodeURIComponent(String(listed.data.id)));
    return [{ url: new URL(path, listingUrl).href, label: title.replace(/\s+/g, ' ').trim() }];
  });
}

const pause = (ms: number) => new Promise((done) => setTimeout(done, ms));

/**
 * What this year's and last year's folders or pages among `yearLinks` (each named by its year
 * alone) link to, read with `linksOf`: in January a call opened in December still sits in last
 * year's. Older years are not opened (Porto Velho keeps them back to 2019).
 */
async function linksInRecentYears(
  yearLinks: PageLink[],
  linksOf: (html: string, pageUrl: string) => PageLink[],
  source: CallPageSource,
  spacingMs: number,
) {
  const years = [currentYear(), currentYear() - 1].map(String);
  const found: PageLink[] = [];
  for (const year of yearLinks) {
    if (!years.includes(year.label) || !isOnSourceHost(year.url, source.listingUrl)) continue;
    await pause(spacingMs);
    const page = await fetchPageHtml(year.url, source.listingUrl, source);
    found.push(...linksOf(page.html, page.url));
  }
  return found;
}

/**
 * The folders a call page links under its own path (`callFilesInSubfolders`: FJA-RN's "PUBLICAÇÕES
 * CHAMADA 01_26", "ANEXOS PARA INSCRIÇÃO…"); breadcrumbs and menus sit above it.
 */
const subfoldersLinkedBelow = ({ html, url }: FetchedPage) =>
  linksOfHtml(html, url).filter((link) => isBelowFolder(link.url, url));

/**
 * The links in a call's `subfolders` (Porto Velho files most documents, results included, one
 * folder each; FJA-RN, notices and annexes apart). Stops at the first result posted, on the call
 * page or below: the call is dropped anyway, and Porto Velho's 002/2026 holds 18 subfolders.
 * Throws past `deadline`: a call cut short could miss its result and pay for a closed call.
 */
async function linksInSubfolders(
  subfolders: PageLink[],
  links: PageLink[],
  source: CallPageSource,
  { spacingMs, deadline }: { spacingMs: number; deadline: number },
) {
  const found: PageLink[] = [];
  for (const subfolder of subfolders) {
    if (hasPublishedResult(documentLinksOf([...links, ...found], source.documentUrlParts))) break;
    if (Date.now() > deadline) throw new Error('Subfolders left unread for lack of time');
    await pause(spacingMs);
    const page = await fetchPageHtml(subfolder.url, source.listingUrl, source);
    found.push(...linksOfHtml(page.html, page.url));
  }
  return found;
}

/**
 * The listing's links, from its HTML or, for `callPagesListedAsJson`, its JSON; with
 * `callsFiledInYearFolders` or `callPagesOnYearPages`, those of its recent years' folders or pages
 * too.
 */
async function linksOfCallPageListing(source: CallPageSource, spacingMs: number) {
  const { callPagesListedAsJson, callsFiledInYearFolders, callPagesOnYearPages } = source.discovery;
  if (callPagesListedAsJson) {
    const items = await fetchListingJson(source.listingUrl, source);
    const links = callPageLinksOfJsonListing(items, callPagesListedAsJson, source.listingUrl);
    return { links, url: source.listingUrl };
  }
  const listing = await fetchPageHtml(source.listingUrl, source.listingUrl, source);
  const links = linksOfHtml(listing.html, listing.url);
  if (callsFiledInYearFolders) {
    const yearFolders = folderLinksOfHtml(listing.html, listing.url);
    links.push(...(await linksInRecentYears(yearFolders, folderLinksOfHtml, source, spacingMs)));
  }
  if (callPagesOnYearPages)
    links.push(...(await linksInRecentYears(links, linksOfHtml, source, spacingMs)));
  return { links, url: listing.url };
}

/** Two hops: the listing's call pages, each read for its own documents. */
export async function callsOfCallPages(source: CallPageSource): Promise<OfficialPageCall[]> {
  // Through Firecrawl, call pages keep to its rate limit; on the site itself, a second apart; both
  // at least the site's crawl delay.
  const spacingMs = Math.max(
    source.answersOnlyFromBrazil ? firecrawlRequestSpacingMs : callPageSpacingMs,
    (source.discovery.crawlDelaySeconds ?? 0) * 1_000,
  );
  const pageIsTheNotice = source.discovery.callPageIsTheNotice === true;
  // A page with no notice is no call where the page is the notice ("MATERIAIS EDUCATIVOS") or the
  // source says so (`callPageNeedsNotice`: folders of courses and plans).
  const needsNotice = pageIsTheNotice || source.discovery.callPageNeedsNotice === true;
  const {
    callPagePublishedAtClass,
    callPageTitleClass,
    callTitleOnCallPage,
    callsFiledInYearFolders,
    callFilesInSubfolders,
  } = source.discovery;
  const { links: listing, url: listingUrl } = await linksOfCallPageListing(source, spacingMs);
  /**
   * A link printed the same on the listing and a call page is the site's frame, not the call's
   * (Funarte, 2026-11-15: every page links an internal "Edital No. 409/2025"). Compared as printed:
   * the Câmara's listing links its call's own notice as `…pdf/view`, the call page as `….pdf`.
   */
  const frameUrls = new Set(listing.map(({ url }) => url));
  const callPages = onePerUrl(
    listing.map((link) => withUntruncatedLabel(withHttpsOnHost(link, source.listingUrl))),
  ).filter(
    ({ url, label }) =>
      // An image card links with no text (Guarabira): its page names it.
      (label || callTitleOnCallPage) &&
      titleIsKept(source, label) &&
      !titleNamesAPastCall(label) &&
      !saysRegistrationClosed(label) &&
      url !== source.listingUrl &&
      url !== listingUrl &&
      source.discovery.callPageUrlParts.some((part) => url.includes(part)) &&
      isOnSourceHost(url, source.listingUrl) &&
      !source.documentUrlParts.some((part) => url.includes(part)),
  );
  /**
   * A page inside another call page's folder is part of that call, not one of its own (Funesc,
   * 2026-11-17: "Audições OSJPB - Peças de confronto" under its orchestra call, which posts results
   * the sub-page does not). Measured on the 20 `callPage` listings: only Funesc has any (2 of 67).
   * The site's root is no call's folder: the PNAB platform links its home and calls at root slugs.
   */
  const isInsideAnotherCallPage = (url: string) =>
    callPages.some((other) => new URL(other.url).pathname !== '/' && isBelowFolder(url, other.url));
  const ownCallPages = callPages.filter(({ url }) => !isInsideAnotherCallPage(url));
  const calls: OfficialPageCall[] = [];
  const deadline = Date.now() + callPagesBudgetMs;
  for (const [index, { url, label }] of ownCallPages.entries()) {
    if (Date.now() > deadline) {
      console.warn('Call pages left unread for lack of time', ownCallPages.length - index);
      break;
    }
    // The first one too: the listing was the site's last page.
    await pause(spacingMs);
    let page: PageLink[];
    let heading: string;
    let pageTitle: string;
    let pageText: string;
    try {
      const fetched = await fetchPageHtml(url, source.listingUrl, source);
      if (
        callPagePublishedAtClass &&
        publishedOverAYearAgo(fetched.html, source, callPagePublishedAtClass)
      ) {
        continue;
      }
      page = linksOfHtml(fetched.html, fetched.url);
      const subfolders = callsFiledInYearFolders
        ? folderLinksOfHtml(fetched.html, fetched.url)
        : callFilesInSubfolders
          ? subfoldersLinkedBelow(fetched)
          : [];
      page.push(...(await linksInSubfolders(subfolders, page, source, { spacingMs, deadline })));
      heading = callPageTitleClass
        ? textOfClass(fetched.html, callPageTitleClass)
        : headingOfHtml(fetched.html);
      pageTitle = heading || titleOfHtml(fetched.html);
      pageText = textOfHtml(fetched.html);
    } catch (error) {
      console.warn('Call page not read', url, String(error));
      continue;
    }
    const linked = documentLinksOf(
      page.filter(({ url }) => !frameUrls.has(url)),
      source.documentUrlParts,
    );
    const documents = pageIsTheNotice
      ? withPageAsNotice(linked, { url, label: pageTitle })
      : linked;
    const name = callTitleOnCallPage ? heading || label : label;
    const kept = callDocumentsWorthRecording(documents, name);
    if (!kept || (needsNotice && !kept.some(isNotice))) continue;
    const numberedNotice = kept.find(
      (document) => isNotice(document) && callNumberOf(document.label),
    );
    const title = pageIsTheNotice
      ? pageTitle || name
      : namesNoCall(name)
        ? heading || numberedNotice?.label
        : name;
    if (!title) continue;
    calls.push({
      externalId: url,
      title,
      officialUrl: url,
      documents: kept,
      registrationCloses: registrationClosePrintedIn(pageText, source.timeZone),
    });
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
  const versioned = /(retificad|alterad|atualizad)\w*\D{0,6}(\d[\d/]*)/.exec(plainText(label));
  const date = versioned && plainDateOf(versioned[2]!);
  return date ? date.year * 10_000 + date.month * 100 + date.day : 0;
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
 * A call's documents worth recording, whatever shape the page has: some, no result posted (unless
 * its `title` names a credenciamento), not every notice from before last year. Its newest notice
 * only; `null` when not worth it.
 */
function callDocumentsWorthRecording(documents: PageLink[], title = '') {
  if (documents.length === 0) return null;
  if (hasPublishedResult(documents) && !staysOpenAfterAResult(title)) return null;
  if (noticesNameOnlyYearsBeforeLastYear(documents)) return null;
  return withNewestNoticeOnly(documents);
}

/**
 * On a listing a notice is what makes documents a call (Ponta Grossa, 2026-11-15: two decrees
 * under "Legislação"); a call page is one by its URL, recorded without one for the admin review.
 */
function listedCallDocuments(documents: PageLink[], title?: string) {
  const kept = callDocumentsWorthRecording(documents, title);
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
    if (!recorded || !titleIsKept(source, recorded.notice.label)) return [];
    return [
      {
        externalId: key,
        title: recorded.notice.label,
        officialUrl: source.listingUrl,
        documents: recorded.kept,
        // A listing of bare files printed no close (12 calls measured, 2026-11-18).
        registrationCloses: null,
      },
    ];
  });
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
  return sectionsOfHtml(html, url, headingClass).flatMap(({ heading: rawHeading, links, text }) => {
    const heading = withoutLeadingSymbols(rawHeading);
    if (!heading || !titleIsKept(source, heading) || titleNamesAPastCall(heading)) return [];
    const recorded = listedCallDocuments(documentLinksOf(links, source.documentUrlParts), heading);
    if (!recorded) return [];
    return [
      {
        externalId: heading,
        title: heading,
        officialUrl: source.listingUrl,
        documents: recorded.kept,
        registrationCloses: registrationClosePrintedIn(text, source.timeZone),
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
