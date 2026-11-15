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
 * A page's headings and http(s) links in page order. A link's URL is absolute, without its `#`.
 * Only a heading's opening tag is matched, so a link inside a heading is still read.
 */
function* headingsAndLinksOf(html: string, pageUrl: string) {
  const page = withoutCode(html);
  const headingText = /([\s\S]*?)<\/h[1-6]>/iy;
  for (const match of page.matchAll(
    /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+))[^>]*>([\s\S]*?)<\/a>|<h[1-6]\b[^>]*>/gi,
  )) {
    const [tag, double, single, bare, inner] = match;
    if (/^<h/i.test(tag)) {
      headingText.lastIndex = match.index + tag.length;
      yield { heading: plainLabel(headingText.exec(page)?.[1] ?? '') };
      continue;
    }
    let url: URL;
    try {
      url = new URL(decodeEntities((double ?? single ?? bare ?? '').trim()), pageUrl);
    } catch {
      continue;
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') continue;
    url.hash = '';
    yield { link: { url: url.href, label: plainLabel(inner ?? '') } };
  }
}

/** Links in page order, each URL once: its first label that is not empty wins. */
function onePerUrl(links: PageLink[]): PageLink[] {
  const labelByUrl = new Map<string, string>();
  for (const { url, label } of links) if (!labelByUrl.get(url)) labelByUrl.set(url, label);
  return [...labelByUrl].map(([url, label]) => ({ url, label }));
}

/**
 * The http(s) links of a server-rendered page, in page order, each URL once. A regex over
 * `<a href>` is enough: the sites read are plain HTML, and a link a script would add is not read.
 */
export function linksOfHtml(html: string, pageUrl: string): PageLink[] {
  return onePerUrl([...headingsAndLinksOf(html, pageUrl)].flatMap((item) => item.link ?? []));
}

/** One section per heading: its text and the links under it, up to the next heading. */
export function sectionsOfHtml(html: string, pageUrl: string) {
  const sections: { heading: string; links: PageLink[] }[] = [];
  for (const item of headingsAndLinksOf(html, pageUrl)) {
    if (item.heading !== undefined) sections.push({ heading: item.heading, links: [] });
    else sections.at(-1)?.links.push(item.link);
  }
  return sections.map(({ heading, links }) => ({ heading, links: onePerUrl(links) }));
}

/** A page's first `<h1>` as plain text; empty when it has none. */
export const headingOfHtml = (html: string) =>
  plainLabel(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(withoutCode(html))?.[1] ?? '');
