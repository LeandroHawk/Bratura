import { httpAnswerError } from '../../lib/httpError';
import { ChatCompletionsResponseSchema } from './chatCompletionsPayload';

/** A long call notice on a Pro model can take minutes; past this, the call fails and is retried. */
const chatCompletionsTimeoutMs = 120_000;

export type ChatCompletionsProvider = { baseUrl: string; model: string; apiKey: string };

/**
 * One prompt to any provider that speaks the OpenAI chat format (Gemini's `/v1beta/openai`,
 * OpenAI, OpenRouter…), its JSON answer as `unknown`. Called only by `generateJson.ts`.
 */
export async function generateJsonWithChatCompletions(
  prompt: string,
  { baseUrl, model, apiKey }: ChatCompletionsProvider,
): Promise<unknown> {
  const url = new URL('chat/completions', baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        // JSON mode in the OpenAI format refuses a conversation that never says "JSON".
        { role: 'system', content: 'Answer with one JSON object and nothing else.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(chatCompletionsTimeoutMs),
  });
  if (!response.ok) throw await httpAnswerError(url.host, response);
  const answer = ChatCompletionsResponseSchema.parse(await response.json());
  return JSON.parse(answer.choices[0]!.message.content);
}
