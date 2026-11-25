import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  title: 'Sala em restauro',
  retry: 'Tentar de novo',
  unexpected:
    'Algo saiu do lugar nesta sala. Tente de novo; se continuar, volte para a página inicial.',
  home: 'Voltar para a página inicial',
};

export const RESTORATION_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'Room under restoration',
    retry: 'Try again',
    unexpected:
      'Something in this room fell out of place. Try again; if it persists, go back home.',
    home: 'Back to the home page',
  },
};
