import { ConvexError } from 'convex/values';
import type { AppError } from '@bratura/shared/primitives/code/error/fields';

/**
 * The only way a function reports an expected failure. Throwing (never returning `success: false`)
 * also undoes every write the mutation made before it.
 */
export const appError = (error: AppError) => new ConvexError(error);
