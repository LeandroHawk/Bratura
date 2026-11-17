import type { SourceAccess } from '@bratura/shared/entities/source/fragments/access/fields';
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

/** Firecrawl allows about 10 scrapes a minute: one every 6.5 s stays under it. */
export const firecrawlRequestSpacingMs = 6_500;
/** A 429 waits this long before the one retry. */
const rateLimitWaitMs = 60_000;
/**
 * Firecrawl's own `timeout` is this much shorter than our wait, so it can still send its error
 * (which we would lose by cutting the connection first) before we stop waiting.
 */
const firecrawlAnswerMarginMs = 10_000;

/** `read` again once after a minute when Firecrawl answered 429 (it costs nothing). */
export async function onceMoreIfRateLimited<T>(read: () => Promise<T>): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (!(error instanceof FirecrawlRateLimitedError)) throw error;
    await new Promise<void>((resolve) => setTimeout(resolve, rateLimitWaitMs));
    return await read();
  }
}

/**
 * Some government sites time out from abroad and answer from Brazil (measured 2026-11-16:
 * Pernambuco's and Sergipe's Mapas, Ponta Grossa's listing): Firecrawl fetches them from there.
 */
const locationOf = ({ answersOnlyFromBrazil }: SourceAccess) =>
  answersOnlyFromBrazil ? { location: { country: 'BR' } } : {};

async function postScrape(body: object, apiKey: string, timeoutMs = firecrawlTimeoutMs) {
  const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
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
  access: SourceAccess = {},
): Promise<ScrapedMarkdown> {
  const answer = await postScrape({ url, formats: ['markdown'], ...locationOf(access) }, apiKey);
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
 * The body at `url` as the site sends it now (one credit), within `timeoutMs` (the caller's own
 * budget per page, not a PDF's two minutes). `maxAge: 0`: Firecrawl's cache would otherwise answer
 * a listing up to two days old. Throws when Firecrawl does not answer or answers an error.
 */
export async function scrapeRawBody(
  url: string,
  apiKey: string,
  { access, timeoutMs }: { access: SourceAccess; timeoutMs: number },
): Promise<ScrapedRawBody> {
  const answer = await postScrape(
    {
      url,
      formats: ['rawHtml'],
      maxAge: 0,
      timeout: Math.max(timeoutMs - firecrawlAnswerMarginMs, timeoutMs / 2),
      ...locationOf(access),
    },
    apiKey,
    timeoutMs,
  );
  const { data } = FirecrawlRawHtmlResponseSchema.parse(answer);
  return {
    body: data.rawHtml,
    finalUrl: data.metadata?.url ?? data.metadata?.sourceURL ?? null,
    statusCode: data.metadata?.statusCode ?? null,
    contentType: data.metadata?.contentType ?? null,
  };
}
