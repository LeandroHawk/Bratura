/** Semantic color tokens in styles.css (`--bt-<name>`), for docs and the /design page. */
export const COLOR_TOKENS = [
  { name: 'background', label: 'Fundo da página' },
  { name: 'foreground', label: 'Texto' },
  { name: 'card', label: 'Card' },
  { name: 'muted-foreground', label: 'Texto secundário' },
  { name: 'border', label: 'Borda' },
  { name: 'primary', label: 'Ação principal' },
  { name: 'primary-foreground', label: 'Texto na ação principal' },
  { name: 'ring', label: 'Anel de foco' },
  { name: 'status-open', label: 'Status · aberto' },
  { name: 'status-soon', label: 'Status · prazo curto' },
  { name: 'status-missing', label: 'Status · falta' },
  { name: 'logo-green', label: 'Logo · verde' },
  { name: 'logo-yellow', label: 'Logo · amarelo' },
  { name: 'logo-blue', label: 'Logo · azul' },
  { name: 'wood', label: 'Placa · madeira' },
  { name: 'wood-ink', label: 'Placa · texto' },
] as const;

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
] as const;
