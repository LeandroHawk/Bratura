import { z } from 'zod';

/**
 * An IANA time zone name (`America/Rio_Branco`, `Etc/GMT+3`): one the runtime can read times in.
 * Not `Intl.supportedValuesOf`, which omits valid zones such as `Etc/GMT+3` and `UTC`.
 */
export const ianaTimeZone = z
  .string()
  .regex(/^[A-Za-z_]+(\/[A-Za-z0-9_+-]+)*$/)
  .refine(
    (zone) => {
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: zone });
        return true;
      } catch {
        return false;
      }
    },
    { params: { message: 'unknownTimeZone' } },
  )
  .brand<'IanaTimeZone'>();

/** A zone that passed `ianaTimeZone`: a plain string does not type-check where one is expected. */
export type IanaTimeZone = z.infer<typeof ianaTimeZone>;
