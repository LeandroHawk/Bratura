import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import type { Theme } from '@bratura/ui';

const ptBR = {
  title: 'Design system',
  description: 'Tokens e componentes do @bratura/ui nos temas claro (Acervo) e escuro (Galeria).',
  lead: {
    before: 'Componentes de',
    after:
      '. O claro é o padrão e o escuro aparece quando alguém puxa a corda; aqui os dois aparecem lado a lado. Os contrastes de texto são verificados nos testes do pacote.',
  },
  themes: { light: 'Claro · Acervo', dark: 'Escuro · Galeria' } satisfies Record<Theme, string>,
};

export const STYLEGUIDE_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'Design system',
    description:
      'Tokens and components of @bratura/ui in the light (Acervo) and dark (Galeria) themes.',
    lead: {
      before: 'The components of',
      after:
        '. Light is the default and dark appears when someone pulls the cord; here both stand side by side. Text contrast is checked by the package tests.',
    },
    themes: { light: 'Light · Acervo', dark: 'Dark · Galeria' },
  },
};
