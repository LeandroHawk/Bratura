import type { MatchClassification } from '@bratura/shared/entities/match/enums/classification/enum';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  title: 'Editais para você',
  lead: 'Cada edital para artistas conferido com um portfólio, item a item, pelo que o próprio edital diz.',
  counts: {
    eligible: 'Abertos e elegíveis',
    almostEligible: 'Abertos e quase elegíveis',
    notEligible: 'Abertos e não elegíveis',
  } satisfies Record<MatchClassification, string>,
};

export const MATCH_SUMMARY_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'Calls for you',
    lead: 'Every call for artists checked against a portfolio, item by item, by what the call itself says.',
    counts: {
      eligible: 'Open and eligible',
      almostEligible: 'Open and almost eligible',
      notEligible: 'Open and not eligible',
    },
  },
};
