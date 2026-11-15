import { afterEach, describe, expect, test, vi } from 'vitest';
import { fetchPageHtml, isFetchableFromListing } from './client';

function siteAnswers(body: BodyInit, headers: Record<string, string>, status = 200) {
  const fetchMock = vi.fn<typeof fetch>(async () => new Response(body, { status, headers }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('isFetchableFromListing', () => {
  const listing = 'https://www.ba.gov.br/fundacaocultural/editais-2026';

  test("only https on the listing's own host", () => {
    expect(isFetchableFromListing('https://www.ba.gov.br/fundacaocultural/edital-x', listing)).toBe(
      true,
    );
    expect(isFetchableFromListing('http://www.ba.gov.br/fundacaocultural/edital-x', listing)).toBe(
      false,
    );
    expect(isFetchableFromListing('https://ba.gov.br.example.com/edital-x', listing)).toBe(false);
    expect(isFetchableFromListing('https://forms.cloud.microsoft/x', listing)).toBe(false);
  });
});

describe('fetchPageHtml', () => {
  const page = 'https://cultura.ma.gov.br/programas-ou-campanhas/editais-secma';

  test('gives the page back in its own charset, never letting fetch follow a redirect', async () => {
    const latin1 = new Uint8Array([0x53, 0x65, 0x6c, 0x65, 0xe7, 0xe3, 0x6f]); // "Seleção"
    const fetchMock = siteAnswers(latin1, { 'content-type': 'text/html; charset=ISO-8859-1' });
    expect(await fetchPageHtml(page)).toEqual({ html: 'Seleção', url: page });
    expect(fetchMock.mock.calls[0]?.[1]?.redirect).toBe('manual');
  });

  test('follows a redirect to https on the same host only', async () => {
    const renamed = 'https://www.cultura.pr.gov.br/Pagina/Edital-de-Mobilidade-Cultural';
    const answers = (location: string) => {
      const fetchMock = vi.fn<typeof fetch>(async (input) =>
        String(input) === renamed
          ? new Response(null, { status: 301, headers: { location } })
          : new Response('<html>ok', { headers: { 'content-type': 'text/html' } }),
      );
      vi.stubGlobal('fetch', fetchMock);
      return fetchMock;
    };
    const fetchMock = answers('/Pagina/Programa-Mobilidade-Cultural');
    const final = 'https://www.cultura.pr.gov.br/Pagina/Programa-Mobilidade-Cultural';
    expect(await fetchPageHtml(renamed)).toEqual({ html: '<html>ok', url: final });
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe(final);
    answers('https://example.com/x');
    await expect(fetchPageHtml(renamed)).rejects.toThrow('redirected off its host');
    answers('http://www.cultura.pr.gov.br/Pagina/Programa-Mobilidade-Cultural');
    await expect(fetchPageHtml(renamed)).rejects.toThrow('redirected off its host');
  });

  test('a redirect loop fails', async () => {
    siteAnswers('', { location: page }, 302);
    await expect(fetchPageHtml(page)).rejects.toThrow('redirected over 3 times');
  });

  test('an error answer, a file instead of a page, or a page too large fails, naming the host', async () => {
    siteAnswers('', { 'content-type': 'text/html' }, 503);
    await expect(fetchPageHtml(page)).rejects.toThrow('cultura.ma.gov.br answered HTTP 503');
    siteAnswers('%PDF', { 'content-type': 'application/pdf' });
    await expect(fetchPageHtml(page)).rejects.toThrow('answered application/pdf');
    siteAnswers('<html>', { 'content-type': 'text/html', 'content-length': '4000000' });
    await expect(fetchPageHtml(page)).rejects.toThrow('answered over 3000000 bytes');
  });
});
