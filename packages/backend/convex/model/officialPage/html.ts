import type { OfficialPageSource } from '@bratura/shared/entities/source/kinds/official-page/variant';
import { plainText } from '../../lib/text';
import { VoltoListedItemSchema, VoltoStateSchema, VoltoTextLinkSchema } from './payload';

/** A link on a page: where it goes, absolute, and the text a person reads on it. */
export type PageLink = { url: string; label: string };

const namedEntities: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  ordm: 'º',
  ordf: 'ª',
  deg: '°',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  laquo: '«',
  raquo: '»',
};

/** `&ccedil;`, `&Atilde;`: the accented letters Portuguese pages still write as entities. */
const accentMarks: Record<string, string> = {
  grave: '\u0300',
  acute: '\u0301',
  circ: '\u0302',
  tilde: '\u0303',
  uml: '\u0308',
  cedil: '\u0327',
};

function namedEntity(name: string) {
  const accented = /^([a-z])(grave|acute|circ|tilde|uml|cedil)$/i.exec(name);
  if (accented) return `${accented[1]}${accentMarks[accented[2]!.toLowerCase()]}`.normalize('NFC');
  return namedEntities[name.toLowerCase()];
}

function decodeEntities(text: string) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, name: string) => {
    if (name[0] !== '#') return namedEntity(name) ?? entity;
    const code =
      name[1] === 'x' || name[1] === 'X' ? parseInt(name.slice(2), 16) : Number(name.slice(1));
    return Number.isInteger(code) && code > 0 && code <= 0x10ffff
      ? String.fromCodePoint(code)
      : entity;
  });
}

const plainLabel = (inner: string) =>
  decodeEntities(inner.replace(/<[^>]*>/g, ' '))
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** A page without its scripts, styles and comments, whose text and links are not the page's. */
const withoutCode = (html: string) =>
  html.replace(/<(script|style)\b[\s\S]*?<\/\1>|<!--[\s\S]*?-->/gi, '');

/**
 * A link whose text is only an action (Estância, 2026-11-15: every file is "Visualizar" then
 * "Baixar" under its name in bold). Without a name, no rule can tell its notice from a result.
 */
const namesOnlyAnAction = (label: string) => /^(baixar|visualizar)$/.test(plainText(label));

/**
 * A link's name when it shows no text, only an icon: its `aria-label` (Palmas, 2026-11-18:
 * "Visualizar PDF Edital … Nº 05/2026/FCP" on an eye icon). Not `title`, a tooltip that can name an
 * action: Salvador's share icon, "Copiar link!", precedes each call's link on its listing.
 */
function ariaLabelOf(openingTag: string) {
  const value = /(?<![\w-])aria-label\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(openingTag);
  return plainLabel(value?.[1] ?? value?.[2] ?? '');
}

/** The first text in `html`: "<p><strong>Edital 022</strong></p>" → "Edital 022". */
const firstTextOf = (html: string) =>
  html
    .split(/<[^>]*>/)
    .map(plainLabel)
    .find((text) => text) ?? '';

/** An element's opening tag whose `class` holds `className` as a whole word; group 1 is its tag. */
const openingTagOfClass = (className: string) =>
  `<([a-z][a-z0-9]*)\\b[^>]*?\\bclass\\s*=\\s*["'][^"']*?(?<![\\w-])${className.replace(/[^\w-]/g, '\\$&')}(?![\\w-])[^>]*>`;

/**
 * An element's inner HTML from `start` (just past its opening tag) to its closing `</tag>`, and
 * where that closing tag ends; `null` when the page never closes it.
 */
function elementInnerFrom(page: string, start: number, closing: RegExp) {
  closing.lastIndex = start;
  const inner = closing.exec(page);
  return inner ? { inner: inner[1] ?? '', end: closing.lastIndex } : null;
}

const closingTagOf = (tag: string) => new RegExp(`([\\s\\S]*?)</${tag}>`, 'iy');

/** The text of a page's first element of `className`, up to its closing tag; empty with none. */
export function textOfClass(html: string, className: string) {
  const page = withoutCode(html);
  const opening = new RegExp(openingTagOfClass(className), 'i').exec(page);
  if (!opening) return '';
  const element = elementInnerFrom(
    page,
    opening.index + opening[0].length,
    closingTagOf(opening[1]!),
  );
  return plainLabel(element?.inner ?? '');
}

/** A link's absolute http(s) URL without its `#`; `null` for another scheme or no URL at all. */
function httpUrlOf(href: string, baseUrl: string) {
  if (!URL.canParse(href, baseUrl)) return null;
  const url = new URL(href, baseUrl);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  url.hash = '';
  return url.href;
}

/**
 * What a page's relative links resolve against: its `<base href>`, else its own URL. Erechim
 * (2026-11-18) declares `<base href="https://www.pmerechim.rs.gov.br//">` and links
 * `pagina/1848/…`: against the page URL every call page is a 404.
 */
function baseUrlOf(page: string, pageUrl: string) {
  const base = /<base\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(page);
  try {
    return base
      ? new URL(decodeEntities((base[1] ?? base[2] ?? '').trim()), pageUrl).href
      : pageUrl;
  } catch {
    return pageUrl;
  }
}

/** What titles a section besides an `<h1-6>`: the source's `documentsUnderHeadings` options. */
type OtherHeadings = Pick<
  Extract<OfficialPageSource['discovery'], { hops: 'documentsUnderHeadings' }>,
  'headingClass' | 'headingEndsAtFirstLink' | 'boldParagraphIsHeading'
>;

/**
 * A page's headings, http(s) links and the text between them, in page order. A link's URL is
 * absolute, without its `#`.
 * Only a heading's opening tag is matched, so a link inside a heading is still read. A link that
 * names only an action takes the first text between it and the item before, else that link's label.
 * An element of `headingClass` is a heading too: accordions title their items with a button or
 * an in-page link (Recife `accordion-toggle`, Spcine `x-acc-header`), never an `<h1-6>`. So is a
 * paragraph that opens in bold, with `boldParagraphIsHeading` (RS Sedac). With
 * `headingEndsAtFirstLink`, a `headingClass` element is titled by its text before its first link.
 * A link opened inside another ends it, as a browser's parser does: Campo Grande's Fundac
 * (2026-11-20) wraps its call cards' links in a block link, whose `</a>` would swallow them.
 */
function* headingsAndLinksOf(
  html: string,
  pageUrl: string,
  { headingClass, headingEndsAtFirstLink, boldParagraphIsHeading }: OtherHeadings = {},
) {
  const page = withoutCode(html);
  const baseUrl = baseUrlOf(page, pageUrl);
  // With neither, `(?!)` never matches and its group stays empty.
  const otherHeading = headingClass
    ? openingTagOfClass(headingClass)
    : boldParagraphIsHeading
      ? '<(p)\\b[^>]*>(?=\\s*<strong\\b)'
      : '(?!)()';
  // Any `</h1-6>` ends an `<h1-6>`: pages close an `<h2>` with `</h3>`.
  const standardHeadingText = /([\s\S]*?)<\/h[1-6]>/iy;
  let previousEnd = 0;
  let previousLinkLabel = '';
  for (const match of page.matchAll(
    new RegExp(
      `${otherHeading}|<a\\b[^>]*?\\bhref\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>"']+))[^>]*>([\\s\\S]*?)(?:</a>|(?=<a\\b))|<(h[1-6])\\b[^>]*>`,
      'gi',
    ),
  )) {
    const [tag, otherHeadingTag, double, single, bare, inner, headingTag] = match;
    const textBefore = page.slice(previousEnd, match.index);
    yield { textHtml: textBefore };
    if (otherHeadingTag || headingTag) {
      const heading = elementInnerFrom(
        page,
        match.index + tag.length,
        otherHeadingTag ? closingTagOf(otherHeadingTag) : standardHeadingText,
      );
      previousEnd = heading?.end ?? match.index + tag.length;
      previousLinkLabel = '';
      const inner = heading?.inner ?? '';
      const title =
        otherHeadingTag && headingClass && headingEndsAtFirstLink
          ? inner.split(/<a\b/i, 1)[0]!
          : inner;
      yield { heading: plainLabel(title) };
      continue;
    }
    previousEnd = match.index + tag.length;
    let label = plainLabel(inner ?? '') || ariaLabelOf(tag.slice(0, tag.indexOf('>') + 1));
    if (namesOnlyAnAction(label)) label = firstTextOf(textBefore) || previousLinkLabel || label;
    previousLinkLabel = label;
    const href = decodeEntities((double ?? single ?? bare ?? '').trim());
    // An in-page anchor is the page itself, never its base: Funarte's "Ir para o Conteúdo" would be
    // `…/chamadas-2026/`, a folder holding every call page.
    const url = httpUrlOf(href, href.startsWith('#') ? pageUrl : baseUrl);
    if (url) yield { link: { url, label } };
  }
  yield { textHtml: page.slice(previousEnd) };
}

/** A label that is only a date: Sesi MG's news cards link each post by its date, then its title. */
const isOnlyADate = (label: string) => /^\d{2}\/\d{2}\/\d{4}$/.test(label);

/**
 * Links in page order, each URL once: its first label that is not empty wins, or a later one when
 * the first is only a date ("13/10/2026" would title a call, and fail every title filter).
 */
export function onePerUrl(links: PageLink[]): PageLink[] {
  const labelByUrl = new Map<string, string>();
  for (const { url, label } of links) {
    const kept = labelByUrl.get(url);
    if (!kept || (isOnlyADate(kept) && label && !isOnlyADate(label))) labelByUrl.set(url, label);
  }
  return [...labelByUrl].map(([url, label]) => ({ url, label }));
}

/**
 * The http(s) links of a server-rendered page, in page order, each URL once, then those only its
 * embedded Volto state holds. A regex over `<a href>` is enough elsewhere: the sites read are plain
 * HTML, and a link a script would add is not read.
 */
export function linksOfHtml(html: string, pageUrl: string): PageLink[] {
  return onePerUrl([
    ...[...headingsAndLinksOf(html, pageUrl)].flatMap((item) => item.link ?? []),
    ...linksInVoltoState(html, pageUrl),
  ]);
}

/** The text a Volto text node holds, its children's included. */
function textOfVoltoNode(node: unknown): string {
  if (Array.isArray(node)) return node.map(textOfVoltoNode).join('');
  if (!node || typeof node !== 'object') return '';
  const { text, children } = node as { text?: unknown; children?: unknown };
  return (typeof text === 'string' ? text : '') + textOfVoltoNode(children);
}

/** Every link node anywhere in a Volto page's text blocks. */
function* voltoTextLinksOf(node: unknown): Generator<PageLink> {
  if (Array.isArray(node)) {
    for (const child of node) yield* voltoTextLinksOf(child);
    return;
  }
  if (!node || typeof node !== 'object') return;
  const link = VoltoTextLinkSchema.safeParse(node);
  if (link.success)
    yield { url: link.data.data.url, label: plainLabel(textOfVoltoNode(link.data)) };
  for (const child of Object.values(node)) yield* voltoTextLinksOf(child);
}

/** `undefined`, which a script may assign and JSON lacks, where a JSON value stands. */
const undefinedValue = /(?<=[:,[]\s*)undefined(?=\s*[,}\]])/g;

/**
 * The links a gov.br Volto page (`window.__data = {…}`) keeps only in its embedded state: its
 * listing's and folder's items, named by their title, and the links in its text blocks (IPHAN and
 * Museu do Índio, 2026-11-18: the HTML prints "Carregando" and no file). Empty for any other page.
 */
function linksInVoltoState(html: string, pageUrl: string): PageLink[] {
  const json = /window\.__data\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/.exec(html)?.[1];
  if (!json) return [];
  let state: unknown;
  try {
    state = JSON.parse(json.replace(undefinedValue, 'null'));
  } catch {
    return [];
  }
  const parsed = VoltoStateSchema.safeParse(state);
  if (!parsed.success) return [];
  const { content, querystringsearch } = parsed.data;
  const listed = [
    ...(content?.data?.items ?? []),
    ...Object.values(querystringsearch?.subrequests ?? {}).flatMap(({ items }) => items),
  ].flatMap((item) => {
    const listedItem = VoltoListedItemSchema.safeParse(item);
    if (!listedItem.success) return [];
    const { title, getURL, '@id': id } = listedItem.data;
    const url = [getURL, id].find((candidate) => candidate && URL.canParse(candidate));
    return url ? [{ url, label: plainLabel(title) }] : [];
  });
  const inText = [...voltoTextLinksOf(content?.data?.blocks ?? {})];
  return [...listed, ...inText].flatMap(({ url, label }) => {
    const absolute = httpUrlOf(url, pageUrl);
    return absolute ? [{ url: absolute, label }] : [];
  });
}

/**
 * The folders a Livewire file manager opens with a button, not a link (Porto Velho, 2026-11-18:
 * `<button wire:click="selectFolder(88673)">`, also served at `?folder=88673`), as links named by
 * the button's first text: a second one describes the folder.
 */
export function folderLinksOfHtml(html: string, pageUrl: string): PageLink[] {
  const buttons = withoutCode(html).matchAll(
    /<button\b[^>]*?\bwire:click\s*=\s*["']selectFolder\((\d+)\)["'][^>]*>([\s\S]*?)<\/button>/gi,
  );
  return onePerUrl(
    [...buttons].map(([, id, inner]) => {
      const url = new URL(pageUrl);
      url.search = `?folder=${id}`;
      return { url: url.href, label: firstTextOf(inner ?? '') };
    }),
  );
}

/**
 * One section per heading: the links under it, up to the next heading, and its text with their
 * labels.
 */
export function sectionsOfHtml(html: string, pageUrl: string, otherHeadings?: OtherHeadings) {
  const sections: { heading: string; links: PageLink[]; texts: string[] }[] = [];
  for (const item of headingsAndLinksOf(html, pageUrl, otherHeadings)) {
    if (item.heading !== undefined) {
      sections.push({ heading: item.heading, links: [], texts: [] });
      continue;
    }
    const section = sections.at(-1);
    if (item.link) {
      section?.links.push(item.link);
      section?.texts.push(item.link.label);
    } else if (item.textHtml) section?.texts.push(plainLabel(item.textHtml));
  }
  return sections.map(({ heading, links, texts }) => ({
    heading,
    links: onePerUrl(links),
    text: texts.filter((text) => text).join(' '),
  }));
}

/** A page's text, without its scripts, styles and comments. */
export const textOfHtml = (html: string) => plainLabel(withoutCode(html));

/**
 * A page's first `<h1>` with text, as plain text; empty when it has none. A logo's `<h1>` holds
 * only an image link (Secult-RN Mais Cultura, 2026-11-18).
 */
export const headingOfHtml = (html: string) =>
  [...withoutCode(html).matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)]
    .map(([, inner]) => plainLabel(inner ?? ''))
    .find(Boolean) ?? '';

/**
 * A page's `<title>` without the site's name after its last " - " or " | " (Badesc, 2026-11-17:
 * "EDITAL DE EXPOSIÇÕES ESPAÇO FERNANDO BECK 2027 - Fundação Cultural Badesc", no `<h1>`).
 */
export const titleOfHtml = (html: string) =>
  plainLabel(/<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(withoutCode(html))?.[1] ?? '').replace(
    /\s[-|–]\s[^-|–]*$/,
    '',
  );
