import { httpAnswerError } from '../../lib/httpError';
import { FirecrawlRawHtmlResponseSchema, FirecrawlScrapeResponseSchema } from './payload';

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

/**
 * Past about 10 scrapes a minute Firecrawl answers 429; it costs nothing, the read waits and
 * retries.
 */
export class FirecrawlRateLimitedError extends Error {
  constructor() {
    super('Firecrawl answered HTTP 429: rate limited');
  }
}

export type ScrapedMarkdown = { markdown: string; creditsUsed: number | null };

/**
 * Where Firecrawl fetches from. Some government sites time out from abroad and answer from Brazil
 * (measured 2026-11-16: Pernambuco's and Sergipe's Mapas, Ponta Grossa's listing).
 */
export type FirecrawlFetchOrigin = { fromBrazil: boolean };

const locationOf = ({ fromBrazil }: FirecrawlFetchOrigin) =>
  fromBrazil ? { location: { country: 'BR' } } : {};

async function postScrape(body: object, apiKey: string) {
  const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(firecrawlTimeoutMs),
  });
  if (response.status === 402) throw new FirecrawlOutOfCreditsError();
  if (response.status === 429) throw new FirecrawlRateLimitedError();
  if (!response.ok) throw await httpAnswerError('Firecrawl', response);
  return (await response.json()) as unknown;
}

/** Reads one page or PDF as Markdown. Throws when Firecrawl does not answer or answers an error. */
export async function scrapeMarkdown(
  url: string,
  apiKey: string,
  origin: FirecrawlFetchOrigin = { fromBrazil: false },
): Promise<ScrapedMarkdown> {
  const answer = await postScrape({ url, formats: ['markdown'], ...locationOf(origin) }, apiKey);
  const { data } = FirecrawlScrapeResponseSchema.parse(answer);
  return { markdown: data.markdown, creditsUsed: data.metadata?.creditsUsed ?? null };
}

/** What a site sent through Firecrawl, unconverted, and where and how it answered. */
export type ScrapedRawBody = {
  body: string;
  finalUrl: string | null;
  statusCode: number | null;
  contentType: string | null;
};

/**
 * The body at `url` as the site sent it, fetched by Firecrawl from Brazil (one credit). Throws when
 * Firecrawl does not answer or answers an error.
 */
export async function scrapeRawBodyFromBrazil(
  url: string,
  apiKey: string,
): Promise<ScrapedRawBody> {
  const answer = await postScrape(
    { url, formats: ['rawHtml'], ...locationOf({ fromBrazil: true }) },
    apiKey,
  );
  const { data } = FirecrawlRawHtmlResponseSchema.parse(answer);
  return {
    body: data.rawHtml,
    finalUrl: data.metadata?.url ?? data.metadata?.sourceURL ?? null,
    statusCode: data.metadata?.statusCode ?? null,
    contentType: data.metadata?.contentType ?? null,
  };
}
