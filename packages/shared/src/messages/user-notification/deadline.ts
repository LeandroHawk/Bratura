import { deadlinePartsInSaoPaulo } from '../../primitives/code/calendar/calendar';
import type { ZonedInstant } from '../../primitives/code/time/zoned-instant/fields';
import type { Locale } from '../../primitives/external/locale/enum';

/**
 * A registration close as a date a person reads: "20/11" for a `day`, "21/11, às 23h59" for a
 * `minute` (en: "11/20", "11/21 at 23:59 (São Paulo time)"). What a card or a details row shows
 * beside its own label.
 */
export function registrationCloseDateText(closes: ZonedInstant, locale: Locale): string {
  const { day, month, time } = deadlinePartsInSaoPaulo(closes);
  const date = locale === 'pt-BR' ? `${day}/${month}` : `${month}/${day}`;
  if (time === null) return date;
  return locale === 'pt-BR'
    ? `${date}, às ${time.hour}h${time.minute}`
    : `${date} at ${time.hour}:${time.minute} (São Paulo time)`;
}

/**
 * How a registration close reads in a message: "encerram em 21/11, às 23h59" / "encerram até
 * 20/11" for pt-BR, "closes on 11/21 at 23:59 (São Paulo time)" / "closes by 11/20" for en;
 * `null` when the source gives none. The caller decides whether the close is worth saying (an
 * open-ended sentinel is never one).
 */
export function registrationCloseText(closes: ZonedInstant | null, locale: Locale): string | null {
  if (closes === null) return null;
  const date = registrationCloseDateText(closes, locale);
  if (closes.precision === 'day')
    return locale === 'pt-BR' ? `encerram até ${date}` : `closes by ${date}`;
  return locale === 'pt-BR' ? `encerram em ${date}` : `closes on ${date}`;
}
