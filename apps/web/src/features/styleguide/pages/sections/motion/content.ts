import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  title: 'Movimento',
  items: ['rise-in', 'um depois', 'do outro'],
  note: 'Itens de uma lista sobem um após o outro; o campo ganha uma pincelada ao receber foco e treme ao ser recusado; o botão salvo dá um pulo. Tudo desliga com "reduzir movimento".',
};

export const MOTION_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'Motion',
    items: ['rise-in', 'one after', 'the other'],
    note: 'List items rise one after another; a field gets a brush stroke on focus and shakes when refused; the saved button hops. All of it stops with "reduce motion".',
  },
};
