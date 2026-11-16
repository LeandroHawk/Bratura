import { afterEach, describe, expect, test, vi } from 'vitest';
import { fetchOnSourceHost, isOnSourceHost } from './fetchOnSourceHost';

afterEach(() => {
  vi.unstubAllGlobals();
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
    await expect(fetchOnSourceHost(file, pdf)).rejects.toThrow('answered over 10 bytes');
    expect(sent).toBeLessThan(3);
  });

  test('a body under the ceiling comes back whole, with its type and final URL', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('%PDF-1', { headers: { 'content-type': 'application/pdf' } })),
    );
    const { body, contentType, finalUrl } = await fetchOnSourceHost(file, pdf);
    expect(new TextDecoder().decode(body)).toBe('%PDF-1');
    expect([contentType, finalUrl]).toEqual(['application/pdf', file]);
  });
});
