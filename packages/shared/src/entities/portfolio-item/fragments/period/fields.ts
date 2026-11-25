import { z } from 'zod';
import { validationMessage } from '../../../../primitives/code/validation-message/validation-message';

/**
 * When an experience or a project happened, as calendar days (`2026-03-14`); the end is `null`
 * for a single day or for something still running.
 */
export const PortfolioItemPeriodFields = z.object({
  startDate: z.iso.date().nullable(),
  endDate: z.iso.date().nullable(),
});

type PortfolioItemPeriod = z.infer<typeof PortfolioItemPeriodFields>;

/**
 * Refuses an end before the start. Attach it last, to the schema that parses: Zod 4 throws on
 * `.pick`/`.omit`/`.partial` of a refined object.
 */
export function withOrderedPeriod<Schema extends z.ZodType<PortfolioItemPeriod>>(schema: Schema) {
  return schema.refine(
    ({ startDate, endDate }) => startDate === null || endDate === null || endDate >= startDate,
    { path: ['endDate'], ...validationMessage('endsBeforeItStarts') },
  );
}
