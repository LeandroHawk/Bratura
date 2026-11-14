import type { IanaTimeZone } from '../time/time-zone/fields';

/** A date and time with no zone, as a source writes it: read in a zone to become an instant. */
export type PlainDateTime = Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', number>;

// One formatter, built once: building a formatter costs far more than formatting with it. `en-CA` writes the
// ISO order; the locale extension pins the Gregorian calendar and Latin digits.
const saoPauloDateFormatter = new Intl.DateTimeFormat('en-CA-u-ca-gregory-nu-latn', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** The calendar day `instant` falls on in São Paulo, as `YYYY-MM-DD`. */
export function plainDateInSaoPaulo(instant: number) {
  return saoPauloDateFormatter.format(instant);
}

// One formatter per zone, built once: building one costs far more than formatting with it. The
// locale pins the Gregorian calendar and Latin digits; `h23` keeps midnight 00, never 24.
const formatterByZone = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string) {
  let formatter = formatterByZone.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    formatterByZone.set(timeZone, formatter);
  }
  return formatter;
}

/** How far `timeZone` is ahead of UTC at `instant`, in milliseconds (negative across Brazil). */
function offsetAt(instant: number, timeZone: string) {
  const parts = formatterFor(timeZone).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((candidate) => candidate.type === type)?.value);
  const dateTimeAsUtc = Date.UTC(
    part('year'),
    part('month') - 1,
    part('day'),
    part('hour'),
    part('minute'),
    part('second'),
  );
  return dateTimeAsUtc - Math.floor(instant / 1000) * 1000;
}

/**
 * The instant a date and time names in `timeZone` (Temporal's `PlainDateTime` → `Instant`, which
 * Node 22 lacks). The second pass corrects a guess that fell across an offset change.
 */
export function instantFromPlainDateTimeInZone(dateTime: PlainDateTime, timeZone: IanaTimeZone) {
  const { year, month, day, hour, minute, second } = dateTime;
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const firstGuess = asUtc - offsetAt(asUtc, timeZone);
  return asUtc - offsetAt(firstGuess, timeZone);
}
