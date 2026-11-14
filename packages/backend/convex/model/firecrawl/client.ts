import { httpAnswerError } from '../../lib/httpError';
import { FirecrawlScrapeResponseSchema } from './payload';

/** A PDF of 30 pages or more can take minutes to read; past this, the read fails and is retried. */
const firecrawlTimeoutMs = 120_000;

/**
 * The plan's credits ran out (HTTP 402; the free plan has no pay-as-you-go). A batch stops on it:
 * every other read would fail the same way (`docs/integrations/firecrawl.md`, Decisions).
 */
export class FirecrawlOutOfCreditsError extends Error {
  constructor() {
    super('Firecrawl answered HTTP 402: out of credits');
  }
}

/** Reads one page or PDF as Markdown. Throws when Firecrawl does not answer or answers an error. */
export async function scrapeMarkdown(url: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, formats: ['markdown'] }),
    signal: AbortSignal.timeout(firecrawlTimeoutMs),
  });
  if (response.status === 402) throw new FirecrawlOutOfCreditsError();
  if (!response.ok) throw await httpAnswerError('Firecrawl', response);
  return FirecrawlScrapeResponseSchema.parse(await response.json()).data.markdown;
}
