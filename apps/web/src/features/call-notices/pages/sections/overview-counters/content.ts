import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  title: 'Todos os editais',
  lead: 'Os editais para artistas e grupos que o Bratura leu nas fontes oficiais, sirvam ou não para o seu perfil.',
  counts: {
    open: 'Ainda não encerrados',
    closingSoon: 'Encerrando em breve',
    isNew: 'Novos nesta semana',
    saved: 'Salvos por você',
  },
};

export const OVERVIEW_COUNTERS_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'All calls',
    lead: 'The calls for artists and groups Bratura read from the official sources, whether or not they suit your profile.',
    counts: {
      open: 'Not yet closed',
      closingSoon: 'Closing soon',
      isNew: 'New this week',
      saved: 'Saved by you',
    },
  },
};
