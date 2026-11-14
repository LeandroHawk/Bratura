import { afterEach, describe, expect, test, vi } from 'vitest';
import { FirecrawlOutOfCreditsError, scrapeMarkdown } from './client';

function firecrawlAnswers(body: unknown, status = 200) {
  const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('scrapeMarkdown', () => {
  test('asks for Markdown only and gives it back', async () => {
    const fetchMock = firecrawlAnswers({ success: true, data: { markdown: '# Edital' } });
    expect(await scrapeMarkdown('https://example.gov.br/edital.pdf', 'fc-key')).toBe('# Edital');
    const body: unknown = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ url: 'https://example.gov.br/edital.pdf', formats: ['markdown'] });
  });

  test('out of credits is its own error, so a batch can stop on it', async () => {
    firecrawlAnswers({ success: false }, 402);
    await expect(scrapeMarkdown('https://example.gov.br/a.pdf', 'fc-key')).rejects.toBeInstanceOf(
      FirecrawlOutOfCreditsError,
    );
  });
});
