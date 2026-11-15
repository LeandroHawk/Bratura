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

/** Paraná renames pages and answers the old slug with a 301 (2026-11-15: 6 call pages). */
const maxRedirects = 3;

/**
 * The page's answer, following a redirect only to https on the same host: one elsewhere could
 * lead anywhere, an internal address included.
 */
async function fetchOnSameHost(url: string): Promise<Response> {
  let current = url;
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const response = await fetch(current, {
      headers: { Accept: 'text/html', 'User-Agent': 'Bratura (+https://bratura.vercel.app)' },
      redirect: 'manual',
      signal: AbortSignal.timeout(pageTimeoutMs),
    });
    const location = response.headers.get('location');
    if (response.status < 300 || response.status >= 400 || !location) return response;
    await response.body?.cancel();
    const next = new URL(location, current).href;
    if (!isFetchableFromListing(next, url)) {
      throw new Error(`${new URL(url).host} redirected off its host`);
    }
    current = next;
  }
  throw new Error(`${new URL(url).host} redirected over ${maxRedirects} times`);
}

/**
 * One page's HTML, fetched plainly (no Firecrawl credits). Throws when the site does not answer,
 * redirects off its own host, answers an error or something other than HTML, or sends more than
 * `pageMaxBytes`.
 */
export async function fetchPageHtml(url: string): Promise<string> {
  const response = await fetchOnSameHost(url);
  const host = new URL(url).host;
  if (!response.ok) throw new Error(`${host} answered HTTP ${response.status}`);
  const type = response.headers.get('content-type') ?? '';
  if (!type.includes('html')) throw new Error(`${host} answered ${type || 'no content type'}`);
  const tooLarge = new Error(`${host} answered over ${pageMaxBytes} bytes`);
  // Before the download when the site says its size; after it, for one that does not.
  if (Number(response.headers.get('content-length')) > pageMaxBytes) throw tooLarge;
  const body = await response.arrayBuffer();
  if (body.byteLength > pageMaxBytes) throw tooLarge;
  return decoderFor(type).decode(body);
}
