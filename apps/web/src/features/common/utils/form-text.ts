/** What a person typed, as the contract stores an optional text: trimmed, `null` when empty. */
export function nullableTextFromInput(text: string): string | null {
  const trimmed = text.trim();
  return trimmed === '' ? null : trimmed;
}

/** The digits of a masked number (`529.982.247-25` → `52998224725`). */
export function digitsFromInput(text: string): string {
  return text.replace(/\D/g, '');
}

/** One entry per line or comma, trimmed, empty ones dropped: how a list is typed in a text box. */
export function listFromInput(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');
}

/** A link typed without its scheme (`instagram.com/maria`) gets `https://`. */
export function linkFromInput(text: string): string {
  const trimmed = text.trim();
  return trimmed === '' || /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
