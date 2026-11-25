/** What a person typed, as the contract stores an optional text: trimmed, `null` when empty. */
export function nullableTextFromInput(text: string): string | null {
  const trimmed = text.trim();
  return trimmed === '' ? null : trimmed;
}

function entriesSplitBy(text: string, separator: RegExp): string[] {
  return text
    .split(separator)
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');
}

/** One entry per line or comma, trimmed, empty ones dropped: how a list is typed in a text box. */
export function listFromInput(text: string): string[] {
  return entriesSplitBy(text, /[\n,]/);
}

/** One entry per line only, for entries a comma can be part of (a link's address). */
export function linesFromInput(text: string): string[] {
  return entriesSplitBy(text, /\n/);
}

/** A link typed without its scheme (`instagram.com/maria`) gets `https://`. */
export function linkFromInput(text: string): string {
  const trimmed = text.trim();
  return trimmed === '' || /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** "1.500,00" and "1500,5" (pt-BR); "1,500.00" and "1500.5" (en): whole reais, then the cents. */
const TYPED_AMOUNTS = [
  /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/,
  /^(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?$/,
];

/**
 * An amount typed in reais as cents; `null` when empty, `NaN` when it is not an amount in one of
 * `TYPED_AMOUNTS` ("1.500,005", "1.50.0"), so the contract refuses it instead of guessing.
 */
export function amountInCentsFromInput(text: string): number | null {
  const trimmed = text.trim().replace(/^R\$\s*/, '');
  if (trimmed === '') return null;
  for (const typedAmount of TYPED_AMOUNTS) {
    const [, reais, cents = ''] = typedAmount.exec(trimmed) ?? [];
    if (reais !== undefined)
      return Number(reais.replace(/[.,]/g, '')) * 100 + Number(cents.padEnd(2, '0'));
  }
  return Number.NaN;
}

/** One person per line, "name, role": what follows the first comma is the role. */
export function peopleFromInput(text: string): { name: string; role: string }[] {
  return linesFromInput(text).map((line) => {
    const [name = '', ...role] = line.split(',');
    return { name: name.trim(), role: role.join(',').trim() };
  });
}
