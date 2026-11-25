import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

/** The pages' names in the browser tab. */
export const CALL_NOTICES_PAGE_TITLE: Record<'matches' | 'overview', Record<Locale, string>> = {
  matches: { 'pt-BR': 'Editais para você', en: 'Calls for you' },
  overview: { 'pt-BR': 'Todos os editais', en: 'All calls' },
};

/** The screen around the sections: the demo notice, and the backend unavailable or failed. */
const screenPtBR = {
  fictionalProfileNotice:
    'As listas e contadores usam o portfólio fictício da Dona Maria. Os detalhes conferem o seu portfólio deste navegador.',
  unavailable: 'Os editais estão indisponíveis no momento. Tente atualizar a página mais tarde.',
  failed: 'Os editais não carregaram agora. Pode ser a conexão; tente de novo em instantes.',
};

export const CALL_NOTICES_SCREEN_CONTENT: Record<Locale, typeof screenPtBR> = {
  'pt-BR': screenPtBR,
  en: {
    fictionalProfileNotice:
      'Lists and counters use Dona Maria’s fictional portfolio. Details check your portfolio from this browser.',
    unavailable: 'Calls are unavailable at the moment. Try reloading the page later.',
    failed: 'The calls did not load just now. It may be the connection; try again in a moment.',
  },
};
