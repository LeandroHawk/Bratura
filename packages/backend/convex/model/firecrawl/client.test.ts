import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  FirecrawlOutOfCreditsError,
  FirecrawlRateLimitedError,
  onceMoreIfRateLimited,
  scrapeMarkdown,
  scrapeRawBody,
} from './client';

function firecrawlAnswers(body: unknown, status = 200) {
  const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('scrapeMarkdown', () => {
  test('asks for Markdown only and gives it back with what it cost', async () => {
    const fetchMock = firecrawlAnswers({
      success: true,
      data: { markdown: '# Edital', metadata: { creditsUsed: 14 } },
    });
    expect(await scrapeMarkdown('https://example.gov.br/edital.pdf', 'fc-key')).toEqual({
      markdown: '# Edital',
      creditsUsed: 14,
    });
    const body: unknown = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ url: 'https://example.gov.br/edital.pdf', formats: ['markdown'] });
  });

  test('out of credits is its own error, so a batch can stop on it', async () => {
    firecrawlAnswers({ success: false }, 402);
    await expect(scrapeMarkdown('https://example.gov.br/a.pdf', 'fc-key')).rejects.toBeInstanceOf(
      FirecrawlOutOfCreditsError,
    );
  });

  test('rate limited is its own error, so a read can wait and retry', async () => {
    firecrawlAnswers({ success: false }, 429);
    await expect(scrapeMarkdown('https://example.gov.br/a.pdf', 'fc-key')).rejects.toBeInstanceOf(
      FirecrawlRateLimitedError,
    );
  });

  test('an answer without its cost reads as an unknown cost, not zero', async () => {
    firecrawlAnswers({ success: true, data: { markdown: '# Edital' } });
    expect(await scrapeMarkdown('https://example.gov.br/a.pdf', 'fc-key')).toEqual({
      markdown: '# Edital',
      creditsUsed: null,
    });
  });
});

describe('fetching from Brazil', () => {
  test('a Markdown read from Brazil asks Firecrawl for a Brazilian location', async () => {
    const fetchMock = firecrawlAnswers({ success: true, data: { markdown: '# Edital' } });
    await scrapeMarkdown('https://mapacultural.pe.gov.br/files/a.pdf', 'fc-key', {
      answersOnlyFromBrazil: true,
    });
    const body: unknown = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({
      url: 'https://mapacultural.pe.gov.br/files/a.pdf',
      formats: ['markdown'],
      location: { country: 'BR' },
    });
  });

  test('a raw body is fresh (no cache), unconverted, with where and how the site answered', async () => {
    const fetchMock = firecrawlAnswers({
      success: true,
      data: {
        rawHtml: '[{"id":1}]',
        metadata: {
          url: 'https://mapacultural.se.gov.br/api/opportunity/find',
          statusCode: 200,
          contentType: 'application/json',
        },
      },
    });
    expect(
      await scrapeRawBody('https://mapacultural.se.gov.br/api/opportunity/find', 'k', {
        access: { answersOnlyFromBrazil: true },
        timeoutMs: 30_000,
      }),
    ).toEqual({
      body: '[{"id":1}]',
      finalUrl: 'https://mapacultural.se.gov.br/api/opportunity/find',
      statusCode: 200,
      contentType: 'application/json',
    });
    const body: unknown = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({
      url: 'https://mapacultural.se.gov.br/api/opportunity/find',
      formats: ['rawHtml'],
      maxAge: 0,
      timeout: 20_000,
      location: { country: 'BR' },
    });
  });
});

describe('onceMoreIfRateLimited', () => {
  test('a 429 waits a minute and reads once more; another error is not retried', async () => {
    vi.useFakeTimers();
    const read = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new FirecrawlRateLimitedError())
      .mockResolvedValueOnce('read');
    const answer = onceMoreIfRateLimited(read);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(await answer).toBe('read');
    expect(read).toHaveBeenCalledTimes(2);

    const failing = vi.fn<() => Promise<string>>().mockRejectedValue(new Error('HTTP 500'));
    await expect(onceMoreIfRateLimited(failing)).rejects.toThrow('HTTP 500');
    expect(failing).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
