import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  title: 'Carregando e erro',
  inline: 'Carregando…',
  closedMessage: 'Os editais não carregaram agora. Pode ser a conexão; tente de novo em instantes.',
};

export const WAITING_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'Loading and failure',
    inline: 'Loading…',
    closedMessage:
      'The calls did not load just now. It may be the connection; try again in a moment.',
  },
};
