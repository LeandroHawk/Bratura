import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  title: 'Todos os editais',
  lead: 'Tudo o que está na base do Bratura, sirva ou não para o seu perfil.',
  counts: {
    total: 'Editais na base',
    open: 'Com inscrições abertas',
    closingSoon: 'Encerrando em breve',
    isNew: 'Novos nesta semana',
    saved: 'Salvos por você',
  },
};

export const OVERVIEW_COUNTERS_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'All calls',
    lead: 'Everything in Bratura’s database, whether or not it suits your profile.',
    counts: {
      total: 'Calls in the database',
      open: 'Open for registration',
      closingSoon: 'Closing soon',
      isNew: 'New this week',
      saved: 'Saved by you',
    },
  },
};
