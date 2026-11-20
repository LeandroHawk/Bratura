import { afterEach, expect, test, vi } from 'vitest';
import { fetchMapasOpportunitiesClosingThisYearOrLater, mapasPageSize } from './client';

afterEach(() => {
  vi.unstubAllGlobals();
});

const baseUrl = 'https://mapa.cultura.gov.br';

/** Answers each page with `sizes[page - 1]` entries, and records the URLs asked. */
function pagesOf(sizes: number[]) {
  const fetchMock = vi.fn<typeof fetch>(async (input) => {
    const page = Number(new URL(String(input)).searchParams.get('@page'));
    const entries = Array.from({ length: sizes[page - 1] ?? 0 }, (_, index) => ({ page, index }));
    return new Response(JSON.stringify(entries), {
      headers: { 'content-type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const askedUrls = (fetchMock: ReturnType<typeof pagesOf>) =>
  fetchMock.mock.calls.map(([input]) => new URL(String(input)));

test('asks every opportunity open today or closed since 1 January of the São Paulo year', async () => {
  const fetchMock = pagesOf([1]);
  // 31/12 22:00 in São Paulo is already 1 January in UTC: the year is São Paulo's.
  await fetchMapasOpportunitiesClosingThisYearOrLater(baseUrl, Date.UTC(2027, 0, 1, 1));
  const [asked] = askedUrls(fetchMock);
  expect(asked?.origin + (asked?.pathname ?? '')).toBe(`${baseUrl}/api/opportunity/find`);
  expect(asked?.searchParams.get('registrationFrom')).toBe('LTE(2026-12-31)');
  expect(asked?.searchParams.get('registrationTo')).toBe('GTE(2026-01-01)');
  expect(asked?.searchParams.get('@order')).toBe('registrationTo ASC,id ASC');
  expect(asked?.searchParams.get('@limit')).toBe(String(mapasPageSize));
});

test('reads page after page until a short one, and returns them all in order', async () => {
  const fetchMock = pagesOf([mapasPageSize, mapasPageSize, 3]);
  const opportunities = await fetchMapasOpportunitiesClosingThisYearOrLater(
    baseUrl,
    Date.UTC(2026, 10, 20),
  );
  expect(askedUrls(fetchMock).map((url) => url.searchParams.get('@page'))).toEqual(['1', '2', '3']);
  expect(opportunities).toHaveLength(2 * mapasPageSize + 3);
  expect(opportunities.at(-1)).toEqual({ page: 3, index: 2 });
});

test('a full last page is followed by an empty one, which ends the list', async () => {
  const fetchMock = pagesOf([mapasPageSize]);
  expect(
    await fetchMapasOpportunitiesClosingThisYearOrLater(baseUrl, Date.UTC(2026, 10, 20)),
  ).toHaveLength(mapasPageSize);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('an instance that never ends its list fails instead of being read forever', async () => {
  const fetchMock = pagesOf(Array(100).fill(mapasPageSize));
  await expect(
    fetchMapasOpportunitiesClosingThisYearOrLater(baseUrl, Date.UTC(2026, 10, 20)),
  ).rejects.toThrow('mapa.cultura.gov.br listed over 8 pages of opportunities');
  expect(fetchMock).toHaveBeenCalledTimes(8);
});

test('an instance redirecting off its host fails instead of being followed', async () => {
  const fetchMock = vi.fn<typeof fetch>(
    async () => new Response(null, { status: 302, headers: { location: 'https://10.0.0.1/' } }),
  );
  vi.stubGlobal('fetch', fetchMock);
  await expect(
    fetchMapasOpportunitiesClosingThisYearOrLater(baseUrl, Date.UTC(2026, 10, 15)),
  ).rejects.toThrow('mapa.cultura.gov.br redirected off its host');
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0]?.[1]?.redirect).toBe('manual');
});
