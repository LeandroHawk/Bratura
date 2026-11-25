import { z } from 'zod';

/** A `POST /chat/completions` answer (the OpenAI format), with only what we read. */
export const ChatCompletionsResponseSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1),
});
