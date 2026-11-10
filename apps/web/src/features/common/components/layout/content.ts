import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import type { PullCordCopy } from '@bratura/ui';

const ptBR = {
  pullCord: {
    turnOff: 'apagar a luz',
    turnOn: 'acender a luz',
    turnedOff: 'Luzes apagadas: tema escuro',
    turnedOn: 'Luzes acesas: tema claro',
  } satisfies PullCordCopy,
  languageNav: 'Idioma',
  skipToContent: 'Ir para o conteúdo [1]',
  withoutJavaScript:
    'Sem JavaScript, a página funciona inteira; só a luz, a troca dos ingressos e a cortina ficam paradas.',
  madeFor: 'Feito para o Hack Brasil 2026 · Trilha Cultura & economia criativa',
  aboutNav: 'Sobre o projeto',
  repoLink: 'GitHub · licença MIT',
};

export const LAYOUT_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    pullCord: {
      turnOff: 'lights off',
      turnOn: 'lights on',
      turnedOff: 'Lights off: dark theme',
      turnedOn: 'Lights on: light theme',
    },
    languageNav: 'Language',
    skipToContent: 'Skip to content [1]',
    withoutJavaScript:
      'Without JavaScript the whole page still works; only the light switch, the ticket swap and the curtain stay still.',
    madeFor: 'Made for Hack Brasil 2026 · Culture & creative economy track',
    aboutNav: 'About the project',
    repoLink: 'GitHub · MIT licence',
  },
};
