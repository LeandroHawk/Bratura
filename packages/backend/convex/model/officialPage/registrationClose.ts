import { instantFromPlainDateTimeInZone } from '@bratura/shared/primitives/code/calendar/calendar';
import type { IanaTimeZone } from '@bratura/shared/primitives/code/time/time-zone/fields';
import type { ZonedInstant } from '@bratura/shared/primitives/code/time/zoned-instant/fields';
import { monthNumberByEnglishName, monthNumberByPortugueseName } from '../../lib/monthNames';
import { plainText } from '../../lib/text';

// The registration close a call page prints in its own text ("As inscrições estão abertas até as
// 23h59 de 25 de novembro de 2026"), read for free before any document is paid for. Measured
// 2026-11-18: the 11 closes the LLM had extracted from those calls' notices all matched.

/** "13/11/2026", "13/11", "1º de dezembro de 2026", "07 fevereiro": day, month, year if written. */
const date = `(\\d{1,2})[º°o]?\\s*(?:/\\s*(\\d{1,2})(?!\\d)(?:\\s*/\\s*(\\d{4}|\\d{2})(?!\\d))?|(?:de\\s+)?(${Object.keys(monthNumberByPortugueseName).join('|')})(?:\\s+de\\s+(\\d{4}))?)`;
const dateGroups = 5;

/** A weekday after a date: "13/11/2026 (sexta-feira) a 23/11/2026". */
const aside = '(?:\\s*\\([^)]{0,20}\\))?';

/** The hour before the day: "as 18h do dia", "as 23h59 de", "as 23 horas e 59 minutos do dia". */
const hour =
  '(?:as\\s+)?\\d{1,2}\\s*h\\S*(?:\\s+(?:horas?|e|\\d+|min\\S*|minutos))*\\s*(?:do\\s+dia\\s+|de\\s+|,\\s*)?';

/** Where a registration sentence starts. */
const registrationWord = /\b(?:inscricao|inscricoes|prazo|submissao|prorrogad[ao]s?)\b/g;

/**
 * Where the dates after it stop being the registration's: results, appeals and the project's run
 * have dates too (MinC: "Prazo de inscrição 13/10/2026 Divulgação do resultado até 27/11/2026").
 */
const otherStage = /resultado|divulga|homologa|recurso|execucao|vigencia|\.\s/;
const registrationSentenceMaxLength = 220;

/**
 * The close in one registration sentence: "até DATE", "encerrando às 18h do dia DATE" (Secec-RJ),
 * the end of "de DATE a DATE".
 */
const closeInSentence = new RegExp(
  `\\b(?:ate|encerrando)\\s+(?:o\\s+)?(?:dia\\s+)?(?:${hour})?${date}|(?:\\bde\\s+)?${date}${aside}\\s+(?:a|ate)\\s+${date}`,
);

/** A close named as such, with no "até": "Término das inscrições 26/07/2026" (Sesc SE). */
const namedClose = new RegExp(
  `\\b(?:termino|encerramento|prazo(?:\\s+final)?)\\s+(?:d[aoe]s?\\s+|para\\s+(?:as\\s+)?)?(?:inscricao|inscricoes|submissao)[\\s:–-]*${date}`,
  'g',
);

const englishMonth = `(${Object.keys(monthNumberByEnglishName).join('|')})`;

/**
 * An English deadline, always with its year (TransArtists, 2026-11-19, 9 of 10 posts): "The
 * deadline for applying is 16 December 2026", "with a deadline: October 30, 2026". Never
 * "Deadlines", the menu entry every page prints.
 */
const englishDeadline = new RegExp(
  `\\bdeadline\\b[^.]{0,40}?(?:(\\d{1,2})\\s+${englishMonth}|${englishMonth}\\s+(\\d{1,2}),?)\\s+(\\d{4})(?!\\d)`,
  'g',
);

type PlainDate = { year: number; month: number; day: number };

const isRealDate = ({ year, month, day }: PlainDate) =>
  new Date(Date.UTC(year, month - 1, day)).getUTCDate() === day && month >= 1 && month <= 12;

const dayNumber = ({ year, month, day }: PlainDate) => Date.UTC(year, month - 1, day);

/** One close as the text writes it, in `yearOfPage` when it gives no year, else with `null`. */
function closeAsWritten(
  groups: (string | undefined)[],
  yearOfPage?: number,
): (Omit<PlainDate, 'year'> & { year: number | null }) | null {
  const [day, numericMonth, numericYear, monthName, writtenYear] = groups;
  const month = numericMonth ? Number(numericMonth) : monthNumberByPortugueseName[monthName ?? ''];
  if (!day || !month) return null;
  const yearText = numericYear ?? writtenYear;
  const yearWritten = yearText && Number(yearText) + (yearText.length === 2 ? 2000 : 0);
  const year = yearWritten || yearOfPage;
  if (year === undefined) return { year: null, month, day: Number(day) };
  const written = { year, month, day: Number(day) };
  return isRealDate(written) ? written : null;
}

/**
 * The registration close a page's text prints, as that day's end in `timeZone`, or `null` when it
 * prints none. With several, the latest: a module or an extension closes later, and a close read
 * too late only costs a read, while one read too early would drop an open call. `yearOfPage` is
 * the year the source files the page under (`callPagesUnderYearHeadings`): a close with no year
 * written is in it.
 */
export function registrationClosePrintedIn(
  text: string,
  timeZone: IanaTimeZone,
  yearOfPage?: number,
): ZonedInstant | null {
  const page = plainText(text).replace(/\s+/g, ' ');
  const closes: ReturnType<typeof closeAsWritten>[] = [];
  for (const word of page.matchAll(registrationWord)) {
    const start = word.index + word[0].length;
    const following = page.slice(start, start + registrationSentenceMaxLength);
    const stageEnd = following.search(otherStage);
    const sentence = stageEnd === -1 ? following : following.slice(0, stageEnd);
    const close = closeInSentence.exec(sentence);
    if (!close) continue;
    const untilGroups = close.slice(1, 1 + dateGroups);
    const rangeEndGroups = close.slice(1 + 2 * dateGroups, 1 + 3 * dateGroups);
    closes.push(closeAsWritten(untilGroups[0] ? untilGroups : rangeEndGroups, yearOfPage));
  }
  for (const close of page.matchAll(namedClose)) {
    closes.push(closeAsWritten(close.slice(1), yearOfPage));
  }
  for (const [, day, month, monthFirst, dayAfter, year] of page.matchAll(englishDeadline)) {
    const written = {
      year: Number(year),
      month: monthNumberByEnglishName[(month ?? monthFirst)!]!,
      day: Number(day ?? dayAfter),
    };
    closes.push(isRealDate(written) ? written : null);
  }
  const withYear = closes.filter((close): close is PlainDate => close?.year != null);
  // A close without its year and no `yearOfPage` ("até 13 de novembro") needs a guess (as in
  // `dateAppearsInQuote`) and may be an extension: the close is unknown, unless it repeats a dated
  // one (Porto Alegre: "até 8 de dezembro" beside "de 16 de outubro a 8 de dezembro de 2026").
  const guessNeeded = closes.some(
    (close) =>
      close?.year === null &&
      !withYear.some(({ month, day }) => month === close.month && day === close.day),
  );
  if (guessNeeded) return null;
  const latest = withYear.sort((a, b) => dayNumber(a) - dayNumber(b)).at(-1);
  if (!latest) return null;
  return {
    at: instantFromPlainDateTimeInZone({ ...latest, hour: 23, minute: 59, second: 59 }, timeZone),
    timeZone,
    precision: 'day',
  };
}
