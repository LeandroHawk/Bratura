import { instantFromPlainDateTimeInZone } from '@bratura/shared/primitives/code/calendar/calendar';
import type { ZonedInstant } from '@bratura/shared/primitives/code/time/zoned-instant/fields';
import { mapasPlainDateTime, type MapasDate } from './payload';

/**
 * A Mapas date as the call notice stores it, or `null` when absent or unreadable. Mapas always
 * gives a time, and closes its form at that exact minute.
 */
export function zonedInstantFromMapasDate(date: MapasDate | null | undefined): ZonedInstant | null {
  const match = date && mapasPlainDateTime.exec(date.date);
  if (!match) return null;
  const part = (index: number) => Number(match[index]);
  const dateTime = {
    year: part(1),
    month: part(2),
    day: part(3),
    hour: part(4),
    minute: part(5),
    second: part(6),
  };
  return {
    at: instantFromPlainDateTimeInZone(dateTime, date.timezone),
    timeZone: date.timezone,
    precision: 'minute',
  };
}
