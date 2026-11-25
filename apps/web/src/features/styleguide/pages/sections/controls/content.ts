import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  title: 'Botões e selos',
  buttons: { primary: 'Começar meu acervo', ghost: 'Ver editais abertos', small: 'Botão pequeno' },
  badges: {
    open: 'Aberto até 12/12',
    soon: 'Prazo curto',
    missing: 'Falta: CCMEI',
    neutral: 'Para você conferir',
    dotOpen: 'Inscrições abertas',
    dotSoon: 'Encerra em breve',
    dotNeutral: 'Prazo não informado',
  },
  tags: { portfolio: 'Portfólio', sicab: 'SICAB', kit: 'Kit de inscrição' },
  link: { before: 'Um link no meio do texto:', text: 'ver todos os editais', after: '.' },
};

export const CONTROLS_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'Buttons and badges',
    buttons: { primary: 'Start my portfolio', ghost: 'See open calls', small: 'Small button' },
    badges: {
      open: 'Open until 12/12',
      soon: 'Closing soon',
      missing: 'Missing: CCMEI',
      neutral: 'For you to check',
      dotOpen: 'Applications open',
      dotSoon: 'Closes soon',
      dotNeutral: 'Deadline not given',
    },
    tags: { portfolio: 'Portfolio', sicab: 'SICAB', kit: 'Application kit' },
    link: { before: 'A link inside a sentence:', text: 'see every call', after: '.' },
  },
};
