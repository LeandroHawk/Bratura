import type { MatchClassification } from '@bratura/shared/entities/match/enums/classification/enum';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  title: 'Editais para você',
  lead: 'Cada edital para artistas conferido com um portfólio, item a item, pelo que o próprio edital diz.',
  counts: {
    eligible: 'Não encerrados e elegíveis',
    almostEligible: 'Não encerrados e quase elegíveis',
    notEligible: 'Não encerrados e não elegíveis',
  } satisfies Record<MatchClassification, string>,
};

export const MATCH_SUMMARY_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'Calls for you',
    lead: 'Every call for artists checked against a portfolio, item by item, by what the call itself says.',
    counts: {
      eligible: 'Not closed and eligible',
      almostEligible: 'Not closed and almost eligible',
      notEligible: 'Not closed and not eligible',
    },
  },
};
