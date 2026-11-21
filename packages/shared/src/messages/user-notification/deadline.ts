import type { ZonedInstant } from '../../primitives/code/time/zoned-instant/fields';
import type { Locale } from '../../primitives/external/locale/enum';

// Reading a call's close for a person: always in America/Sao_Paulo, whatever zone the source
// wrote (`primitives/AGENTS.md`, measured traps). A `minute` close at 00:00 in São Paulo means
// "until the end of the previous day" (`docs/data-sources.md`), so it is shown one minute back.
// Built once: constructing a formatter costs far more than formatting with it.
const saoPauloDateTime = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', {
  timeZone: 'America/Sao_Paulo',
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
});

const partsOf = (instant: number) => {
  const parts = saoPauloDateTime.formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? '';
  return {
    day: part('day'),
    month: part('month'),
    hour: part('hour'),
    minute: part('minute'),
  };
};

/**
 * How a registration close reads in a message: "encerram em 21/11, às 23h59" / "encerram até
 * 20/11" for pt-BR, "closes on 11/21 at 23:59 (São Paulo time)" / "closes by 11/20" for en;
 * `null` when the source gives none. The caller decides whether the close is worth saying (an
 * open-ended sentinel is never one).
 */
export function registrationCloseText(closes: ZonedInstant | null, locale: Locale): string | null {
  if (closes === null) return null;
  const parts = partsOf(closes.at);
  if (closes.precision === 'day')
    return locale === 'pt-BR'
      ? `encerram até ${parts.day}/${parts.month}`
      : `closes by ${parts.month}/${parts.day}`;
  const at =
    Number(parts.hour) === 0 && Number(parts.minute) === 0 ? partsOf(closes.at - 60_000) : parts;
  const hour = at.hour.padStart(2, '0');
  return locale === 'pt-BR'
    ? `encerram em ${at.day}/${at.month}, às ${hour}h${at.minute}`
    : `closes on ${at.month}/${at.day} at ${hour}:${at.minute} (São Paulo time)`;
}
