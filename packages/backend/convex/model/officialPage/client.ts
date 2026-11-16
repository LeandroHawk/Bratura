import { fetchOnSourceHost } from '../sourceHost/fetchOnSourceHost';

/** A government page slower than this is down for today's run (Minas Gerais took 10 s). */
const pageTimeoutMs = 30_000;
/** A listing past this is not a listing: the largest measured, Minas Gerais FEC, is 441 KB. */
const pageMaxBytes = 3_000_000;

function decoderFor(contentType: string) {
  try {
    return new TextDecoder(/charset=([\w-]+)/i.exec(contentType)?.[1] ?? 'utf-8');
  } catch {
    return new TextDecoder();
  }
}

/** A page's HTML and the URL it came from after redirects: its relative links resolve there. */
export type FetchedPage = { html: string; url: string };

/**
 * One page's HTML, on its own host only (`fetchOnSourceHost`). Throws when the site does not
 * answer, redirects off its own host, answers an error or something other than HTML, or sends more
 * than `pageMaxBytes`.
 */
export async function fetchPageHtml(url: string): Promise<FetchedPage> {
  const { body, contentType, finalUrl } = await fetchOnSourceHost(url, {
    accept: 'text/html',
    isExpectedType: (type) => type.includes('html'),
    timeoutMs: pageTimeoutMs,
    maxBytes: pageMaxBytes,
  });
  return { html: decoderFor(contentType).decode(body), url: finalUrl };
}
