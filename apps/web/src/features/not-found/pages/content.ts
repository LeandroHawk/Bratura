import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  title: 'Esta sala não existe',
  text: 'O endereço pode ter mudado ou estar digitado errado.',
  home: 'Voltar para o início',
};

export const NOT_FOUND_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'This room does not exist',
    text: 'The address may have changed or been mistyped.',
    home: 'Back to the home page',
  },
};
