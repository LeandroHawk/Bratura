import { z } from 'zod';

/**
 * What went wrong, as the backend tells a front: the front picks the text (in the creator's
 * language) from this code, never from a message the backend wrote. An unexpected failure is not
 * here: Convex hides it as "Server Error" and logs it.
 */
export const AppErrorCodeEnum = z.enum([
  'invalidInput', // the args broke the contract; `issues` says where
  'notFound',
  'forbidden',
  'conflict', // it already exists, or changed meanwhile
  'unavailable', // an outside service did not answer (Mapas, Firecrawl, Nvoip, Gemini)
]);

export type AppErrorCode = z.infer<typeof AppErrorCodeEnum>;
