/**
 * Every semantic colour token in tokens.css (`--bt-<name>`), grouped for the /design page, which
 * labels them. A test fails when a token is missing here.
 */
export const COLOR_TOKENS = [
  { group: 'base', name: 'background' },
  { group: 'base', name: 'foreground' },
  { group: 'base', name: 'card' },
  { group: 'base', name: 'muted-foreground' },
  { group: 'base', name: 'border' },
  { group: 'base', name: 'primary' },
  { group: 'base', name: 'primary-foreground' },
  { group: 'base', name: 'ring' },
  { group: 'status', name: 'status-open' },
  { group: 'status', name: 'status-open-foreground' },
  { group: 'status', name: 'status-soon' },
  { group: 'status', name: 'status-soon-foreground' },
  { group: 'status', name: 'status-missing' },
  { group: 'status', name: 'status-missing-foreground' },
  { group: 'logo', name: 'logo-green' },
  { group: 'logo', name: 'logo-yellow' },
  { group: 'logo', name: 'logo-blue' },
  { group: 'logo', name: 'logo-outline' },
  { group: 'sign', name: 'wood' },
  { group: 'sign', name: 'wood-grain' },
  { group: 'sign', name: 'wood-edge' },
  { group: 'sign', name: 'wood-ink' },
  { group: 'sign', name: 'wood-shadow' },
  { group: 'sign', name: 'twine' },
  { group: 'cord', name: 'cord' },
  { group: 'cord', name: 'cord-shade' },
  { group: 'cord', name: 'cord-highlight' },
  { group: 'cord', name: 'glow' },
  { group: 'stage', name: 'curtain' },
  { group: 'stage', name: 'curtain-fold' },
  { group: 'stage', name: 'curtain-shadow' },
  { group: 'ticket', name: 'ticket' },
  { group: 'ticket', name: 'ticket-shine' },
  { group: 'ticket', name: 'ticket-ink' },
  { group: 'ticket', name: 'ticket-muted' },
  { group: 'ticket', name: 'ticket-edge' },
  { group: 'ticket', name: 'ticket-stamp' },
  { group: 'ticket', name: 'ticket-stamp-ready' },
  { group: 'art', name: 'art-green' },
  { group: 'art', name: 'art-yellow' },
  { group: 'art', name: 'art-blue' },
  { group: 'art', name: 'art-red' },
] as const;

export type ColorTokenName = (typeof COLOR_TOKENS)[number]['name'];
export type ColorTokenGroup = (typeof COLOR_TOKENS)[number]['group'];

/** Foreground/background pairs that carry text or meaning, with the WCAG minimum each needs. */
export const CONTRAST_PAIRS = [
  { fg: 'foreground', bg: 'background', min: 4.5 },
  { fg: 'foreground', bg: 'card', min: 4.5 },
  { fg: 'muted-foreground', bg: 'background', min: 4.5 },
  { fg: 'muted-foreground', bg: 'card', min: 4.5 },
  { fg: 'primary-foreground', bg: 'primary', min: 4.5 },
  { fg: 'status-open-foreground', bg: 'status-open', min: 4.5 },
  { fg: 'status-soon-foreground', bg: 'status-soon', min: 4.5 },
  { fg: 'status-missing-foreground', bg: 'status-missing', min: 4.5 },
  // "Falta" is also written as plain colored text on a card.
  { fg: 'status-missing', bg: 'card', min: 4.5 },
  { fg: 'ring', bg: 'background', min: 3 },
  { fg: 'primary', bg: 'background', min: 3 },
  // The language sign: painted text on oak, and the board's edge against the wall.
  { fg: 'wood-ink', bg: 'wood', min: 4.5 },
  { fg: 'wood-ink', bg: 'wood-grain', min: 4.5 },
  { fg: 'wood-edge', bg: 'background', min: 3 },
  // The ticket's stamps and labels ("only with a producer", "application ready"): bold text on it.
  { fg: 'ticket-stamp', bg: 'ticket', min: 4.5 },
  { fg: 'ticket-stamp-ready', bg: 'ticket', min: 4.5 },
] as const;
