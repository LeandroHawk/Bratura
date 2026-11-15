import { afterEach, describe, expect, test, vi } from 'vitest';
import { fetchTelegramBot, sendTelegramMessage, TelegramAnswerError } from './client';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchTelegramBot', () => {
  test('calls getMe on the bot URL and gives the bot back', async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () =>
        new Response(JSON.stringify({ ok: true, result: { id: 7, username: 'bratura_bot' } })),
    );
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchTelegramBot({ token: 'tok' })).toEqual({
      id: 7,
      username: 'bratura_bot',
    });
    const [url] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe('https://api.telegram.org/bottok/getMe');
  });
});

describe('sendTelegramMessage', () => {
  const send = { token: 'tok', chatId: '123456789', text: 'Olá!' } as const;

  test('posts chat_id and text and gives the message id back', async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify({ ok: true, result: { message_id: 42 } })),
    );
    vi.stubGlobal('fetch', fetchMock);
    expect(await sendTelegramMessage(send)).toBe('42');
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe('https://api.telegram.org/bottok/sendMessage');
    expect(JSON.parse(String(init?.body))).toEqual({ chat_id: '123456789', text: 'Olá!' });
  });

  test('a 2xx is sent even when the body is not JSON, with a null message id', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => new Response('accepted', { status: 202 })),
    );
    expect(await sendTelegramMessage(send)).toBeNull();
  });

  test('a non-2xx throws with the status and keeps the body out of the tables', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(
        async () =>
          new Response(
            JSON.stringify({ ok: false, error_code: 403, description: 'bot was blocked' }),
            { status: 403 },
          ),
      ),
    );
    const error = await sendTelegramMessage(send).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(TelegramAnswerError);
    expect((error as TelegramAnswerError).status).toBe(403);
  });
});
