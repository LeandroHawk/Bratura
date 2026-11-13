import { z } from 'zod';

/**
 * The only text sizes the contract allows. A field picks one by name, so a ceiling cannot be raised
 * by passing a bigger number: a new size is a new row here, seen in review.
 */
export const textLengths = { short: 64, medium: 200, long: 500, max: 5000 } as const;

export type TextLength = keyof typeof textLengths;

/**
 * Text that must carry something: surrounding spaces are dropped, what is left cannot be empty, and
 * it has a ceiling, because most text here comes from sites we do not control.
 */
export const requiredString = (length: TextLength = 'medium') =>
  z.string().trim().min(1).max(textLengths[length]);

/** Text a source may not give: `null` then, never an empty string, and the same ceiling rule. */
export const nullableString = (length: TextLength = 'max') =>
  z.string().trim().max(textLengths[length]).nullable();
