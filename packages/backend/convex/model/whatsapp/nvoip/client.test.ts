import { afterEach, describe, expect, test, vi } from 'vitest';
import { fetchNvoipAccessToken, NvoipAnswerError, sendNvoipTemplate } from './client';

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
  const send = {
    accessToken: 'tok',
    templateId: 'prazo_chegando',
    destination: '+5511999999999',
    instance: 'instance-1',
    language: 'pt_BR',
  } as const;

  test('posts the template send to v3 and gives the message id back', async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify({ message_id: 'wamid.abc' })),
    );
    vi.stubGlobal('fetch', fetchMock);
    expect(await sendNvoipTemplate({ ...send, bodyVariables: ['Edital X', '3'] })).toBe(
      'wamid.abc',
    );
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe('https://api.nvoip.com.br/v3/wa/sendTemplates');
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer tok');
    expect(JSON.parse(String(init?.body))).toEqual({
      idTemplate: 'prazo_chegando',
      destination: '+5511999999999',
      instance: 'instance-1',
      language: 'pt_BR',
      bodyVariables: ['Edital X', '3'],
    });
  });

  test('omits bodyVariables when there are none', async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify({ message_id: 'wamid.x' })),
    );
    vi.stubGlobal('fetch', fetchMock);
    await sendNvoipTemplate(send);
    const init = fetchMock.mock.calls[0]?.[1];
    expect(JSON.parse(String(init?.body))).not.toHaveProperty('bodyVariables');
  });

  test('a 2xx is sent even when the body is not JSON, with a null message id', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => new Response('queued', { status: 202 })),
    );
    expect(await sendNvoipTemplate(send)).toBeNull();
  });

  test('a 2xx is sent even when the JSON has an unexpected shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ templateId: 'x' }))),
    );
    expect(await sendNvoipTemplate(send)).toBeNull();
  });

  test('a non-2xx throws with the status, so a refusal can be told from a transient', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => new Response('quota exceeded', { status: 429 })),
    );
    const error = await sendNvoipTemplate(send).catch((e) => e);
    expect(error).toBeInstanceOf(NvoipAnswerError);
    expect((error as NvoipAnswerError).status).toBe(429);
    expect((error as Error).message).toMatch(/quota exceeded/);
  });
});
