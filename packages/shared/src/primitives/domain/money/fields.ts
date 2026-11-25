import { z } from 'zod';

/**
 * An amount in Brazilian reais, in cents (R$ 5.000,00 is 500000): an integer, so no sum or
 * comparison ever meets a floating-point rounding. Positive: a call that pays nothing says nothing.
 */
export const requiredAmountInCents = z.int().positive();

/** The same, when the source may not say it (a webhook field, an optional charge). */
export const nullableAmountInCents = requiredAmountInCents.nullable();
