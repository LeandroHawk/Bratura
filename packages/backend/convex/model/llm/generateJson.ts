import { requiredEnv } from '../../lib/env';
import { generateJsonWithChatCompletions } from './chatCompletions';

/**
 * The only LLM call the rest of the backend makes: one prompt, the model's JSON as `unknown`. The
 * caller `safeParse`s it and checks every quote with `evidence.ts` (`docs/security.md` §3). The
 * provider and model are the deployment's (`LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY`): swapping
 * either is `convex env set`, not a change here.
 */
export async function generateJson(prompt: string): Promise<unknown> {
  return await generateJsonWithChatCompletions(prompt, {
    baseUrl: requiredEnv('LLM_BASE_URL'),
    model: requiredEnv('LLM_MODEL'),
    apiKey: requiredEnv('LLM_API_KEY'),
  });
}
