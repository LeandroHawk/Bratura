import { z } from 'zod';
import { ianaTimeZone } from '@bratura/shared/primitives/code/time/time-zone/fields';

/** "2026-11-15 23:59:00.000000": a date and time with no zone, read in the `timezone` beside it. */
export const mapasPlainDateTime = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d+)?$/;

/**
 * A date as Mapas sends it (PHP `DateTime` as JSON): the date and time, and the zone they are read
 * in. A zone the runtime cannot read is refused here, with the rest of the entry.
 */
export const MapasDateSchema = z.object({
  date: z.string().regex(mapasPlainDateTime),
  timezone: ianaTimeZone,
});

export type MapasDate = z.infer<typeof MapasDateSchema>;

/**
 * One opportunity as `GET /api/opportunity/find` returns it, with the `@select` our client asks for.
 * The owner is never selected: it can be a private person (`docs/data-sources.md`, Rules).
 */
export const MapasOpportunitySchema = z.object({
  id: z.int().positive(),
  name: z.string(),
  shortDescription: z.string().nullish(),
  registrationFrom: MapasDateSchema.nullish(),
  registrationTo: MapasDateSchema.nullish(),
  singleUrl: z.string(),
  '@files:downloads': z.array(z.object({ url: z.string() })).optional(),
});

export type MapasOpportunity = z.infer<typeof MapasOpportunitySchema>;
