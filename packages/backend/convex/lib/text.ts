import { textLengths, type TextLength } from '@bratura/shared/primitives/code/string/fields';

/** A text compared by its letters only: no accents, lower case ("Seleção" and "selecao" match). */
export const plainText = (text: string) =>
  text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/**
 * A text from a source cut at the contract's ceiling and marked "…", instead of losing the row it
 * belongs to: the full text stays on the official page, whose link is stored.
 */
export const cutToTextLength = (text: string, length: TextLength) =>
  text.length > textLengths[length] ? `${text.slice(0, textLengths[length] - 1)}…` : text;
