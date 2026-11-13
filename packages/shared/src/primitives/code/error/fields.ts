import { z } from 'zod';
import { AppErrorCodeEnum } from './enum';

/**
 * The data of every `ConvexError` Bratura throws. `issues` are Zod's own, as JSON: each carries its
 * code, path and the numbers a message needs (`maximum`), so the front writes the text.
 */
export const AppErrorSchema = z.object({
  code: AppErrorCodeEnum,
  issues: z.array(z.json()).optional(),
});

export type AppError = z.infer<typeof AppErrorSchema>;
