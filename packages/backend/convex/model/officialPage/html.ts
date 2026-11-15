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
 * The http(s) links of a server-rendered page, in page order, each URL once (its first label that
 * is not empty wins). A regex over `<a href>` is enough: the sites read are plain HTML, and a link
 * a script would add is not read anyway.
 */
export function linksOfHtml(html: string, pageUrl: string): PageLink[] {
  const labelByUrl = new Map<string, string>();
  for (const [, double, single, bare, inner] of withoutCode(html).matchAll(
    /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+))[^>]*>([\s\S]*?)<\/a>/gi,
  )) {
    const href = double ?? single ?? bare ?? '';
    let url: URL;
    try {
      url = new URL(decodeEntities(href.trim()), pageUrl);
    } catch {
      continue;
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') continue;
    url.hash = '';
    const label = plainLabel(inner ?? '');
    if (!labelByUrl.get(url.href)) labelByUrl.set(url.href, label);
  }
  return [...labelByUrl].map(([url, label]) => ({ url, label }));
}

/**
 * A page's own name: its first `<h1>`, else its `<title>` before the site name ("… – FGM Cultura").
 * `null` when it has neither.
 */
export function pageTitleOfHtml(html: string): string | null {
  const page = withoutCode(html);
  const heading = plainLabel(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(page)?.[1] ?? '');
  if (heading) return heading;
  // Only a dash or a bar parts off the site name: a hyphen is part of "Edital 01/2026 - Dança".
  const title = plainLabel(/<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(page)?.[1] ?? '');
  return title.replace(/\s+[–—|]\s+[^–—|]+$/, '') || null;
}
