import { afterEach, expect, test, vi } from 'vitest';
import { fetchOpenMapasOpportunities } from './client';

afterEach(() => {
  vi.unstubAllGlobals();
});

test('an instance redirecting off its host fails instead of being followed', async () => {
  const fetchMock = vi.fn<typeof fetch>(
    async () => new Response(null, { status: 302, headers: { location: 'https://10.0.0.1/' } }),
  );
  vi.stubGlobal('fetch', fetchMock);
  await expect(
    fetchOpenMapasOpportunities('https://mapa.cultura.gov.br', Date.UTC(2026, 10, 15)),
  ).rejects.toThrow('mapa.cultura.gov.br redirected off its host');
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0]?.[1]?.redirect).toBe('manual');
});
