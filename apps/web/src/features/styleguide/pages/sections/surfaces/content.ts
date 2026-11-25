import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = { title: 'Card', body: 'Superfície para um edital, uma peça do acervo, um aviso.' };

export const SURFACES_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: { title: 'Card', body: 'A surface for a call, a portfolio piece, a notice.' },
};
