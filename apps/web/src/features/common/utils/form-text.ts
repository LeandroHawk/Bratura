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

/**
 * An amount typed in reais ("1.500,00", "1500", "1,500.50") as cents; `null` when empty, `NaN`
 * when it is not an amount, so the contract refuses it. A separator followed by one or two final
 * digits is the decimal one; any other is a thousands mark.
 */
export function amountInCentsFromInput(text: string): number | null {
  const trimmed = text.trim().replace(/^R\$\s*/, '');
  if (trimmed === '') return null;
  const typed = /^(\d[\d.,]*?)(?:[.,](\d{1,2}))?$/.exec(trimmed);
  if (typed === null) return Number.NaN;
  const reais = typed[1]?.replace(/[.,]/g, '') ?? '';
  return Number(reais) * 100 + Number((typed[2] ?? '').padEnd(2, '0'));
}

/** One person per line, "name, role": what follows the first comma is the role. */
export function peopleFromInput(text: string): { name: string; role: string }[] {
  return linesFromInput(text).map((line) => {
    const [name = '', ...role] = line.split(',');
    return { name: name.trim(), role: role.join(',').trim() };
  });
}
