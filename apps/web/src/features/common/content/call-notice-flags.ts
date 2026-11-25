import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = { closesSoon: 'Encerrando em breve', isNew: 'Novo' };

/** A call's two flags as every screen names them: the call screens and the landing's board. */
export const CALL_NOTICE_FLAG_LABELS: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: { closesSoon: 'Closing soon', isNew: 'New' },
};
