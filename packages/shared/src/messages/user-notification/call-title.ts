import { textLengths } from '../../primitives/code/string/fields';

const urlPattern = /https?:\/\/\S+|www\.\S+/gi;

/**
 * A call notice's title made safe to quote in a message: it comes from Mapas, where anyone can
 * publish, so links and line breaks leave (a bare URL renders as a link that could pass for
 * ours, and a line break lets a title impersonate its own notice), whitespace collapses and the
 * text is cut at `medium`. It always returns quoted — visually a citation, not our copy
 * (`docs/security.md` §3).
 */
export function callNoticeTitleForMessage(title: string): string {
  const cleaned = title.replace(urlPattern, '').replace(/\s+/g, ' ').trim();
  const cut =
    cleaned.length > textLengths.medium ? `${cleaned.slice(0, textLengths.medium - 1)}…` : cleaned;
  return `"${cut.length > 0 ? cut : '—'}"`;
}
