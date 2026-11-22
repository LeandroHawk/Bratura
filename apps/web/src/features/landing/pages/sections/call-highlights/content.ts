import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  title: 'Editais nas fontes oficiais',
  lead: 'Algumas oportunidades com prazo informado. Confira sempre o edital original.',
  unavailable: 'A consulta de editais está indisponível no momento.',
  loading: 'Consultando editais…',
  empty: 'Nenhum edital com prazo de encerramento disponível agora.',
  viewAll: 'Ver todos os editais',
  officialPage: 'Ver fonte oficial',
};

export const CALL_HIGHLIGHTS_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'Calls from official sources',
    lead: 'Some opportunities with a stated deadline. Always check the original call.',
    unavailable: 'Calls cannot be retrieved at the moment.',
    loading: 'Retrieving calls…',
    empty: 'No calls with a closing date are available right now.',
    viewAll: 'View all calls',
    officialPage: 'View official source',
  },
};
