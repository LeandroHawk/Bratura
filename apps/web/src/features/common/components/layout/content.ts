import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import type { PullCordCopy } from '@bratura/ui';

const ptBR = {
  pullCord: {
    turnOff: 'apagar a luz',
    turnOn: 'acender a luz',
    turnedOff: 'Luzes apagadas: tema escuro',
    turnedOn: 'Luzes acesas: tema claro',
  } satisfies PullCordCopy,
  homeLink: 'Bratura, página inicial',
  map: {
    label: 'Mapa',
    title: 'Mapa do museu',
    closeLabel: 'Fechar o mapa',
    here: 'Você está aqui',
    groundFloor: 'Térreo',
    lobby: 'Saguão',
    offMap: 'Fora do mapa',
  },
  languageNav: 'Idioma',
  skipToContent: 'Ir para o conteúdo [1]',
  withoutJavaScript:
    'Sem JavaScript, a página funciona inteira; só a luz, a troca dos ingressos e a cortina ficam paradas.',
  madeFor: 'Feito para o',
  event: 'Hack Brasil 2026',
  track: 'Trilha Cultura & economia criativa',
  designSystem: 'Design system',
  team: 'Equipe no LinkedIn',
  builtWithSponsors: 'Com os patrocinadores',
  builtWithAgents: 'Programamos com',
  builtWithOthers: 'Também usamos',
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
    homeLink: 'Bratura, home page',
    map: {
      label: 'Map',
      title: 'Museum map',
      closeLabel: 'Close the map',
      here: 'You are here',
      groundFloor: 'Ground floor',
      lobby: 'Lobby',
      offMap: 'Off the map',
    },
    languageNav: 'Language',
    skipToContent: 'Skip to content [1]',
    withoutJavaScript:
      'Without JavaScript the whole page still works; only the light switch, the ticket swap and the curtain stay still.',
    madeFor: 'Made for',
    event: 'Hack Brasil 2026',
    track: 'Culture & creative economy track',
    designSystem: 'Design system',
    team: 'Team on LinkedIn',
    builtWithSponsors: 'With the sponsors',
    builtWithAgents: 'Coded with',
    builtWithOthers: 'Also built with',
  },
};
