import { afterEach, describe, expect, test, vi } from 'vitest';
import { fetchNvoipAccessToken, sendNvoipTemplate } from './client';

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

describe('sendNvoipTemplate', () => {
  test('posts the template send to v3 and gives the message id back', async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify({ message_id: 'wamid.abc' })),
    );
    vi.stubGlobal('fetch', fetchMock);
    expect(
      await sendNvoipTemplate({
        accessToken: 'tok',
        templateId: 'prazo_chegando',
        destination: '+5511999999999',
        instance: 'instance-1',
        language: 'pt_BR',
        bodyVariables: ['Dona Maria', 'Edital X'],
      }),
    ).toBe('wamid.abc');
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe('https://api.nvoip.com.br/v3/wa/sendTemplates');
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer tok');
    expect(JSON.parse(String(init?.body))).toEqual({
      idTemplate: 'prazo_chegando',
      destination: '+5511999999999',
      instance: 'instance-1',
      language: 'pt_BR',
      bodyVariables: ['Dona Maria', 'Edital X'],
    });
  });

  test('omits bodyVariables when there are none and accepts an answer without a message id', async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify({ templateId: 'x' })),
    );
    vi.stubGlobal('fetch', fetchMock);
    expect(
      await sendNvoipTemplate({
        accessToken: 'tok',
        templateId: 'edital_compativel',
        destination: '+5511999999999',
        instance: 'instance-1',
        language: 'en_US',
      }),
    ).toBeNull();
    const init = fetchMock.mock.calls[0]?.[1];
    expect(JSON.parse(String(init?.body))).not.toHaveProperty('bodyVariables');
  });

  test('throws the provider answer on a non-2xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => new Response('quota exceeded', { status: 429 })),
    );
    await expect(
      sendNvoipTemplate({
        accessToken: 'tok',
        templateId: 'prazo_chegando',
        destination: '+5511999999999',
        instance: 'instance-1',
        language: 'pt_BR',
      }),
    ).rejects.toThrow(/429.*quota exceeded/);
  });
});
