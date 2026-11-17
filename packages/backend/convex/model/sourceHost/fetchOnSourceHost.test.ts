import { afterEach, describe, expect, test, vi } from 'vitest';
import { fetchOnSourceHost, isOnSourceHost } from './fetchOnSourceHost';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('isOnSourceHost', () => {
  const listing = 'https://www.ba.gov.br/fundacaocultural/editais-2026';

  test("only https on the source's own host", () => {
    expect(isOnSourceHost('https://www.ba.gov.br/fundacaocultural/edital-x', listing)).toBe(true);
    expect(isOnSourceHost('http://www.ba.gov.br/fundacaocultural/edital-x', listing)).toBe(false);
    expect(isOnSourceHost('https://ba.gov.br.example.com/edital-x', listing)).toBe(false);
    expect(isOnSourceHost('https://forms.cloud.microsoft/x', listing)).toBe(false);
  });
});

describe('fetchOnSourceHost', () => {
  const file = 'https://editalcultural.estancia.se.gov.br/Arquivos/DownloadArquivos/?id=70';
  const pdf = {
    accept: 'application/pdf',
    isExpectedType: (type: string) => type.includes('pdf'),
    timeoutMs: 1_000,
    maxBytes: 10,
  };

  test('a site that does not say its size is cut at the ceiling as the body arrives', async () => {
    const chunks = [new Uint8Array(6), new Uint8Array(6), new Uint8Array(6)];
    let sent = 0;
    // No read-ahead: a chunk is made only when the reader asks for it.
    const stream = new ReadableStream<Uint8Array>(
      {
        pull: (controller) => {
          const chunk = chunks[sent++];
          if (chunk) controller.enqueue(chunk);
          else controller.close();
        },
      },
      { highWaterMark: 0 },
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(stream, { headers: { 'content-type': 'application/pdf' } })),
    );
    await expect(fetchOnSourceHost(file, file, pdf)).rejects.toThrow('answered over 10 bytes');
    expect(sent).toBeLessThan(3);
  });

  test('a body under the ceiling comes back whole, with its type and final URL', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('%PDF-1', { headers: { 'content-type': 'application/pdf' } })),
    );
    const { body, contentType, finalUrl } = await fetchOnSourceHost(file, file, pdf);
    expect(new TextDecoder().decode(body)).toBe('%PDF-1');
    expect([contentType, finalUrl]).toEqual(['application/pdf', file]);
  });
});

describe('fetchOnSourceHost, for a source that answers only from Brazil', () => {
  const api = 'https://mapacultural.se.gov.br/api/opportunity/find?@select=id';
  const json = {
    accept: 'application/json',
    isExpectedType: (type: string) => type.includes('json'),
    timeoutMs: 1_000,
    maxBytes: 1_000,
  };
  const fromBrazil = { answersOnlyFromBrazil: true };

  function firecrawlAnswers(metadata: object, rawHtml = '[]') {
    vi.stubEnv('FIRECRAWL_API_KEY', 'fc-key');
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify({ success: true, data: { rawHtml, metadata } })),
    );
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  test('goes through Firecrawl only, never to the site itself', async () => {
    const fetchMock = firecrawlAnswers(
      { url: api, statusCode: 200, contentType: 'application/json; charset=utf-8' },
      '[{"id":1}]',
    );
    const { body, contentType, finalUrl } = await fetchOnSourceHost(api, api, json, fromBrazil);
    expect(new TextDecoder().decode(body)).toBe('[{"id":1}]');
    expect([contentType, finalUrl]).toEqual(['application/json', api]);
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      'https://api.firecrawl.dev/v2/scrape',
    ]);
  });

  test("a link off the source's host is refused before any request", async () => {
    const fetchMock = firecrawlAnswers({});
    await expect(fetchOnSourceHost('https://example.com/x', api, json, fromBrazil)).rejects.toThrow(
      'not its source',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('an answer that ended on another host is refused', async () => {
    firecrawlAnswers({ url: 'https://example.com/login', statusCode: 200 });
    await expect(fetchOnSourceHost(api, api, json, fromBrazil)).rejects.toThrow('off its host');
  });

  test('an error status or an unexpected type is refused', async () => {
    firecrawlAnswers({ url: api, statusCode: 503 });
    await expect(fetchOnSourceHost(api, api, json, fromBrazil)).rejects.toThrow('HTTP 503');
    firecrawlAnswers({ url: api, statusCode: 200, contentType: 'text/html' });
    await expect(fetchOnSourceHost(api, api, json, fromBrazil)).rejects.toThrow('text/html');
  });

  test('a body over the ceiling is refused', async () => {
    firecrawlAnswers({ url: api, statusCode: 200 }, 'x'.repeat(1_001));
    await expect(fetchOnSourceHost(api, api, json, fromBrazil)).rejects.toThrow('over 1000 bytes');
  });
});
