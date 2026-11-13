import { z } from 'zod';

/**
 * An IANA time zone (`America/Rio_Branco`), the zone a source wrote a time in. The runtime's own
 * list decides which exist: no list kept here.
 */
export const ianaTimeZone = z
  .string()
  .refine((zone) => Intl.supportedValuesOf('timeZone').includes(zone), {
    params: { message: 'unknownTimeZone' },
  });
