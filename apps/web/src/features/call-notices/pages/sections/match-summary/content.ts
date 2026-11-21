import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  title: 'Editais para você',
  lead: (name: string) =>
    `Cada edital conferido com o portfólio de ${name}, requisito a requisito.`,
  mainArea: 'Área cultural principal',
  lastAnalysis: 'Última análise',
  counts: {
    eligible: 'Elegíveis',
    almostEligible: 'Quase elegíveis',
    notEligible: 'Não elegíveis',
  },
};

export const MATCH_SUMMARY_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'Calls for you',
    lead: (name) => `Every call checked against ${name}’s portfolio, requirement by requirement.`,
    mainArea: 'Main cultural area',
    lastAnalysis: 'Last analysis',
    counts: {
      eligible: 'Eligible',
      almostEligible: 'Almost eligible',
      notEligible: 'Not eligible',
    },
  },
};
