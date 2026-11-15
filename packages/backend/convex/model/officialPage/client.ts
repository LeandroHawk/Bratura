/** A government page slower than this is down for today's run (Minas Gerais took 10 s). */
const pageTimeoutMs = 30_000;
/** A listing past this is not a listing: the largest measured, Minas Gerais FEC, is 441 KB. */
const pageMaxBytes = 3_000_000;

/**
 * Whether our backend may fetch `url` for a source listed at `listingUrl`: https on the listing's
 * own host only (`docs/security.md` §4). Any other link the page holds is read through Firecrawl.
 */
export function isFetchableFromListing(url: string, listingUrl: string) {
  const target = new URL(url);
  return target.protocol === 'https:' && target.host === new URL(listingUrl).host;
}

function decoderFor(contentType: string) {
  try {
    return new TextDecoder(/charset=([\w-]+)/i.exec(contentType)?.[1] ?? 'utf-8');
  } catch {
    return new TextDecoder();
  }
}

/**
 * One page's HTML, fetched plainly (no Firecrawl credits). Throws when the site does not answer,
 * redirects (a redirect could lead anywhere), answers an error or something other than HTML, or
 * sends more than `pageMaxBytes`.
 */
export async function fetchPageHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { Accept: 'text/html', 'User-Agent': 'Bratura (+https://bratura.vercel.app)' },
    redirect: 'error',
    signal: AbortSignal.timeout(pageTimeoutMs),
  });
  const host = new URL(url).host;
  if (!response.ok) throw new Error(`${host} answered HTTP ${response.status}`);
  const type = response.headers.get('content-type') ?? '';
  if (!type.includes('html')) throw new Error(`${host} answered ${type || 'no content type'}`);
  const body = await response.arrayBuffer();
  if (body.byteLength > pageMaxBytes)
    throw new Error(`${host} answered over ${pageMaxBytes} bytes`);
  return decoderFor(type).decode(body);
}
