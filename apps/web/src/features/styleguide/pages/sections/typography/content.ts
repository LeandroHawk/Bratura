import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  title: 'Tipografia',
  display: 'Fraunces nos títulos',
  caption: 'Fraunces itálico nas legendas',
  body: 'Instrument Sans no texto corrido, feito para ler bem em qualquer tela.',
  eyebrow: 'Etiqueta (Eyebrow)',
};

export const TYPOGRAPHY_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'Typography',
    display: 'Fraunces for headings',
    caption: 'Fraunces italic for captions',
    body: 'Instrument Sans for running text, made to read well on any screen.',
    eyebrow: 'Label (Eyebrow)',
  },
};
