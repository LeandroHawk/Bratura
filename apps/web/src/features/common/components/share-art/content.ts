import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

/** Footnote of the link preview card; its headline is the site's TAGLINE. */
const ptBR = {
  footnote: 'Hack Brasil 2026 · Cultura & economia criativa',
};

export const SHARE_CARD_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    footnote: 'Hack Brasil 2026 · Culture & creative economy',
  },
};
