import { z } from 'zod';
import { internalZodAction } from './lib/builders';
import { generateJson } from './model/llm/generateJson';

// Extraction (16–18/11): each call notice's Markdown → its fields, each `null` or with a verbatim
// quote checked by `model/llm/evidence.ts`. Batch only, never per user request. Only the
// credentials check exists yet.

const CheckLlmCredentialsActionArgsSchema = z.object({});
const CheckLlmCredentialsActionReturnsSchema = z.literal(true);

/** Proves this deployment's LLM key answers JSON. Spends one free-tier call; reads no source. */
export const checkLlmCredentials = internalZodAction({
  args: CheckLlmCredentialsActionArgsSchema,
  returns: CheckLlmCredentialsActionReturnsSchema,
  handler: async () => {
    const answer = await generateJson('Answer exactly {"ok": true}.');
    z.object({ ok: z.literal(true) }).parse(answer);
    return true as const;
  },
});
