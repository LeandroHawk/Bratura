import { afterEach, describe, expect, test, vi } from 'vitest';
import { FirecrawlOutOfCreditsError, FirecrawlRateLimitedError, scrapeMarkdown } from './client';

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
