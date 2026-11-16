import { extractText } from 'unpdf';
import { fetchOnSameHost, isFetchableFromListing } from '../officialPage/client';

/** Estância's gazette editions run 20 MB; the action has 512 MiB and parsing one took 240 MB. */
const pdfMaxBytes = 30_000_000;
/** A 20 MB edition from a municipal server. */
const pdfTimeoutMs = 60_000;

/**
 * A PDF's own text layer, read by our backend: only on the source's own host over https, following
 * redirects only there (`docs/security.md` §4). `null` when the link is elsewhere, the answer is no
 * PDF or too large, or the file cannot be parsed. A scan has no text layer: only Firecrawl's OCR
 * reads it, so this is never the first reader. The bundled pdf.js (6.4.299) compiles no code from
 * a file (no `eval`, no `Function`: CVE-2024-4367's font path is gone) and fetches nothing.
 */
export async function pdfTextOnSourceHost(url: string, sourceUrl: string): Promise<string | null> {
  if (!isFetchableFromListing(url, sourceUrl)) return null;
  try {
    const { response } = await fetchOnSameHost(url, 'application/pdf', pdfTimeoutMs);
    const isPdf = (response.headers.get('content-type') ?? '').includes('pdf');
    if (!response.ok || !isPdf || Number(response.headers.get('content-length')) > pdfMaxBytes) {
      await response.body?.cancel();
      return null;
    }
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > pdfMaxBytes) return null;
    // Given the bytes, unpdf destroys the parsed document once read: its memory does not wait.
    const { text } = await extractText(new Uint8Array(bytes), { mergePages: true });
    return text;
  } catch (error) {
    console.warn('PDF text not read on the source host', url, String(error));
    return null;
  }
}
