/** What a person typed, as the contract stores an optional text: trimmed, `null` when empty. */
export function nullableTextFromInput(text: string): string | null {
  const trimmed = text.trim();
  return trimmed === '' ? null : trimmed;
}

/** The digits of a masked number (`529.982.247-25` → `52998224725`). */
export function digitsFromInput(text: string): string {
  return text.replace(/\D/g, '');
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
 * Digits laid into a mask as they are typed: `#` takes a digit, anything else is written between
 * them (`maskedFromDigits('52998224725', '###.###.###-##')` → `529.982.247-25`).
 */
export function maskedFromDigits(text: string, mask: string): string {
  const digits = digitsFromInput(text);
  let used = 0;
  let masked = '';
  for (const slot of mask) {
    if (used >= digits.length) break;
    masked += slot === '#' ? digits[used++] : slot;
  }
  return masked;
}

export const CPF_MASK = '###.###.###-##';
export const CEP_MASK = '#####-###';
export const MOBILE_PHONE_MASK = '(##) #####-####';
