import { z } from 'zod';
import { ianaTimeZone } from '../time-zone/fields';
import { requiredInstant } from '../instant/fields';

/**
 * A time as a source published it, shown in its own zone. `minute`: `at` is exact. `day` ("até
 * 20/11"): `at` is that day's end in `timeZone`, only to sort and alert, never shown as a time.
 */
export const ZonedInstantSchema = z.object({
  at: requiredInstant,
  timeZone: ianaTimeZone,
  precision: z.enum(['day', 'minute']),
});

export type ZonedInstant = z.infer<typeof ZonedInstantSchema>;
