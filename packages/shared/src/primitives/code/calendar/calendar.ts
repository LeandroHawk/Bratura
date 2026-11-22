import type { IanaTimeZone } from '../time/time-zone/fields';

/** A date and time with no zone, as a source writes it: read in a zone to become an instant. */
export type PlainDateTime = Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', number>;

// One formatter, built once: building a formatter costs far more than formatting with it. `en-CA`
// writes the ISO order; the locale extension pins the Gregorian calendar and Latin digits.
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

/** The calendar day `days` after `date` (`YYYY-MM-DD`): counted in UTC, a day has no zone. */
export function plainDateDaysAfter({ date, days }: { date: string; days: number }) {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + days);
  return day.toISOString().slice(0, 10);
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

// Reading a deadline for a person: always in America/Sao_Paulo, whatever zone the source wrote
// (`primitives/AGENTS.md`, measured traps). Built once: constructing a formatter costs far more
// than formatting with it.
const saoPauloDateTime = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', {
  timeZone: 'America/Sao_Paulo',
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
});

const partsInSaoPaulo = (instant: number) => {
  const parts = saoPauloDateTime.formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? '';
  return { day: part('day'), month: part('month'), hour: part('hour'), minute: part('minute') };
};

/**
 * The day and, for a `minute` deadline, the time a person reads it at, in São Paulo: the one
 * reading of a call's close. A `minute` deadline at 00:00 means "until the end of the previous
 * day" (`docs/data-sources.md`), so it is read one minute back. `time` is `null` for a `day`.
 */
export function deadlinePartsInSaoPaulo(deadline: { at: number; precision: 'day' | 'minute' }) {
  const parts = partsInSaoPaulo(deadline.at);
  if (deadline.precision === 'day') return { day: parts.day, month: parts.month, time: null };
  const { day, month, hour, minute } =
    Number(parts.hour) === 0 && Number(parts.minute) === 0
      ? partsInSaoPaulo(deadline.at - 60_000)
      : parts;
  return { day, month, time: { hour: hour.padStart(2, '0'), minute } };
}
