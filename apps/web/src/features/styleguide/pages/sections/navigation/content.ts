import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  title: 'Navegação',
  corridor:
    'Do tablet para cima, as salas da área logada são portas num corredor, com a saída no fim.',
  map: 'No celular, a placa da sala atual fica no rodapé; tocada, abre o mapa do museu.',
};

export const NAVIGATION_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'Navigation',
    corridor:
      'From a tablet up, the signed-in rooms are doors along a corridor, the exit at its end.',
    map: 'On a phone, the current room’s plaque sits at the bottom; tapped, it opens the museum map.',
  },
};
