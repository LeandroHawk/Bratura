const normalizeWhitespace = (text: string) => text.replace(/\s+/g, ' ').trim();

/**
 * Whether a quote the model returned appears, word for word, in the text we sent it (whitespace
 * normalized). A field whose quote fails becomes `null` (`docs/security.md` §3). An empty quote
 * never passes: it would prove nothing.
 */
export function quoteAppearsInText(quote: string, text: string): boolean {
  const normalizedQuote = normalizeWhitespace(quote);
  return normalizedQuote.length > 0 && normalizeWhitespace(text).includes(normalizedQuote);
}

// "5.000,00", "5000", "1,5" — a Brazilian number — optionally followed by "mil" / "milhão(ões)".
// Spelled-out amounts ("cinco mil reais") are not read: such a field becomes `null`.
const brazilianAmount =
  /(?<![\d.,])(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?(?:\s*(mil|milh[ãa]o|milh[õo]es)(?!\p{L}))?/giu;
const amountMultiplier = (suffix: string | undefined) =>
  !suffix ? 1 : suffix.toLowerCase() === 'mil' ? 1_000 : 1_000_000;

/**
 * Whether an extracted amount, in cents, is one of the amounts written in its quote
 * ("R$ 5.000,00", "R$ 5 mil", "1,5 milhão"). The other half of `docs/security.md` §3: a quote
 * that is in the text but says another number does not back the field.
 */
export function amountAppearsInQuote({
  amountInCents,
  quote,
}: {
  amountInCents: number;
  quote: string;
}): boolean {
  if (!Number.isSafeInteger(amountInCents) || amountInCents <= 0) return false;
  for (const [, whole, fraction, suffix] of quote.matchAll(brazilianAmount)) {
    const value = Number(`${whole!.replaceAll('.', '')}.${fraction ?? '0'}`);
    if (Math.round(value * amountMultiplier(suffix) * 100) === amountInCents) return true;
  }
  return false;
}

const monthByName: Record<string, number> = {
  janeiro: 1,
  fevereiro: 2,
  março: 3,
  marco: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
};
const numericDate = /(?<!\d)(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})(?!\d)/g;
const isoDate = /(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/g;
const writtenDate = new RegExp(
  `(?<!\\d)(\\d{1,2})[º°o]?\\s+de\\s+(${Object.keys(monthByName).join('|')})\\s+(?:de\\s+)?(\\d{4})(?!\\d)`,
  'giu',
);

const isoFromParts = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

/** Every full date written in a text, as `YYYY-MM-DD`. A date without its year is not one. */
function datesWrittenIn(text: string): Set<string> {
  const dates = new Set<string>();
  for (const [, day, month, year] of text.matchAll(numericDate)) {
    const fullYear = year!.length === 2 ? 2000 + Number(year) : Number(year);
    dates.add(isoFromParts(fullYear, Number(month), Number(day)));
  }
  for (const [, year, month, day] of text.matchAll(isoDate)) {
    dates.add(isoFromParts(Number(year), Number(month), Number(day)));
  }
  for (const [, day, monthName, year] of text.matchAll(writtenDate)) {
    dates.add(isoFromParts(Number(year), monthByName[monthName!.toLowerCase()]!, Number(day)));
  }
  return dates;
}

/**
 * Whether an extracted date (`YYYY-MM-DD`) is written in its quote ("20/11/2026", "20.11.26",
 * "20 de novembro de 2026", "1º de dezembro de 2026"). A quote without the year never backs a
 * date: the year would be the model's guess.
 */
export function dateAppearsInQuote({ date, quote }: { date: string; quote: string }): boolean {
  return datesWrittenIn(quote).has(date);
}
