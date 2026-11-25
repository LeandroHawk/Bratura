import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

/** The pages' names in the browser tab. */
export const CALL_NOTICES_PAGE_TITLE: Record<'matches' | 'overview', Record<Locale, string>> = {
  matches: { 'pt-BR': 'Editais para você', en: 'Calls for you' },
  overview: { 'pt-BR': 'Todos os editais', en: 'All calls' },
};
