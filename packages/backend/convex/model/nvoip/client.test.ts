import { afterEach, describe, expect, test, vi } from 'vitest';
import { fetchNvoipAccessToken } from './client';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchNvoipAccessToken', () => {
  test('sends the client credentials as Basic and gives the token back', async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify({ access_token: 'tok', token_type: 'Bearer' })),
    );
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchNvoipAccessToken({ clientId: 'id', clientSecret: 'secret' })).toBe('tok');
    const init = fetchMock.mock.calls[0]?.[1];
    expect(new Headers(init?.headers).get('Authorization')).toBe(`Basic ${btoa('id:secret')}`);
    expect(String(init?.body)).toBe('grant_type=client_credentials');
  });
});
