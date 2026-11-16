// Our backend fetches only a registered source's own host (`docs/security.md` §4): every request
// whose URL a source's data can choose goes through here. Any other link is read by Firecrawl.

/**
 * Whether `url` is https on the host of `sourceUrl`, a registered source's own URL: a call page
 * on its listing's host, a document on its source's host.
 */
export function isOnSourceHost(url: string, sourceUrl: string) {
  const target = new URL(url);
  return target.protocol === 'https:' && target.host === new URL(sourceUrl).host;
}

/** Paraná renames pages and answers the old slug with a 301 (2026-11-15: 6 call pages). */
const maxRedirects = 3;

/** What `fetchOnSourceHost` asks and accepts. */
export type SourceHostRequest = {
  accept: string;
  /** Whether the answer's content type is what was asked: checked before the download. */
  isExpectedType: (contentType: string) => boolean;
  timeoutMs: number;
  maxBytes: number;
};

/** A body from a source's host, its content type, and the URL it came from after redirects. */
export type SourceHostAnswer = { body: Uint8Array; contentType: string; finalUrl: string };

/**
 * The answer at `url`, following a redirect only to https on the same host: one elsewhere could
 * lead anywhere, an internal address included.
 */
async function answerOnSameHost(url: string, { accept, timeoutMs }: SourceHostRequest) {
  let current = url;
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const response = await fetch(current, {
      headers: { Accept: accept, 'User-Agent': 'Bratura (+https://bratura.vercel.app)' },
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
    });
    const location = response.headers.get('location');
    if (response.status < 300 || response.status >= 400 || !location) {
      return { response, finalUrl: current };
    }
    await response.body?.cancel();
    const next = new URL(location, current).href;
    if (!isOnSourceHost(next, url)) throw new Error(`${new URL(url).host} redirected off its host`);
    current = next;
  }
  throw new Error(`${new URL(url).host} redirected over ${maxRedirects} times`);
}

/**
 * The body, read as it arrives and dropped past `maxBytes`: a site that does not say its size
 * cannot fill the action's memory before the ceiling holds.
 */
async function bodyUpTo(response: Response, maxBytes: number, tooLarge: Error) {
  if (Number(response.headers.get('content-length')) > maxBytes) {
    await response.body?.cancel();
    throw tooLarge;
  }
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = response.body?.getReader();
  for (let chunk = await reader?.read(); chunk && !chunk.done; chunk = await reader?.read()) {
    size += chunk.value.byteLength;
    if (size > maxBytes) {
      await reader?.cancel();
      throw tooLarge;
    }
    chunks.push(chunk.value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

/**
 * One file from a registered source's own host, fetched plainly (no Firecrawl credits). Throws,
 * naming the host, when `url` is not on `sourceUrl`'s host, the site does not answer, redirects off
 * its host, answers an error or an unexpected type, or sends over `maxBytes`.
 */
export async function fetchOnSourceHost(
  url: string,
  sourceUrl: string,
  request: SourceHostRequest,
): Promise<SourceHostAnswer> {
  const host = new URL(url).host;
  if (!isOnSourceHost(url, sourceUrl)) throw new Error(`${host} is not its source's own host`);
  const { response, finalUrl } = await answerOnSameHost(url, request);
  const contentType = response.headers.get('content-type') ?? '';
  if (!response.ok || !request.isExpectedType(contentType)) await response.body?.cancel();
  if (!response.ok) throw new Error(`${host} answered HTTP ${response.status}`);
  if (!request.isExpectedType(contentType)) {
    throw new Error(`${host} answered ${contentType || 'no content type'}`);
  }
  const tooLarge = new Error(`${host} answered over ${request.maxBytes} bytes`);
  return { body: await bodyUpTo(response, request.maxBytes, tooLarge), contentType, finalUrl };
}
