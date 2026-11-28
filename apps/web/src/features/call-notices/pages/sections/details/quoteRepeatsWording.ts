/** Lowercase words without accents or punctuation, so two copies of one passage compare equal. */
function comparableWords(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** A list marker left in front of a passage: "a)", "II -", "15.1.6.". */
const LIST_MARKER = /^(?:\d{1,2}(?: \d{1,2})*|[a-z]|[ivx]{1,4}) $/;

/** Whether the call's passage only repeats the wording already shown, at most after its marker. */
export function quoteRepeatsWording(wording: string, quote: string): boolean {
  const shown = comparableWords(wording);
  const passage = comparableWords(quote);
  if (shown === '') return false;
  if (passage === shown) return true;
  return (
    passage.endsWith(` ${shown}`) &&
    LIST_MARKER.test(passage.slice(0, passage.length - shown.length))
  );
}
