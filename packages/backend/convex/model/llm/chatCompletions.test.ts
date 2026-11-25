import { afterEach, describe, expect, test, vi } from 'vitest';
import { generateJsonWithChatCompletions } from './chatCompletions';

const gemini = {
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
  model: 'some-model',
  apiKey: 'llm-key',
};

function providerAnswers(content: string) {
  const fetchMock = vi.fn<typeof fetch>(
    async () => new Response(JSON.stringify({ choices: [{ message: { content } }] })),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('generateJsonWithChatCompletions', () => {
  test('asks the configured model in JSON mode and gives the JSON back unparsed by any schema', async () => {
    const fetchMock = providerAnswers('{"amount":null}');
    expect(await generateJsonWithChatCompletions('prompt', gemini)).toEqual({ amount: null });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe(
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    );
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer llm-key');
    expect(JSON.parse(String(init?.body))).toMatchObject({
      model: 'some-model',
      response_format: { type: 'json_object' },
    });
  });

  test('a base URL with or without its final slash reaches the same endpoint', async () => {
    const fetchMock = providerAnswers('{}');
    await generateJsonWithChatCompletions('prompt', { ...gemini, baseUrl: `${gemini.baseUrl}/` });
    expect(String(fetchMock.mock.calls[0]![0])).toBe(
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    );
  });
});
