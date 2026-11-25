import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { CALL_NOTICE_FLAG_LABELS } from '@/features/common/content/call-notice-flags';

/** The cards pinned to the board, and the list's waiting, empty and next-page states. */
const ptBR = {
  loading: 'Carregando os editais…',
  published: 'No Bratura desde',
  isNew: CALL_NOTICE_FLAG_LABELS['pt-BR'].isNew,
  details: 'Ver detalhes',
  checkEligibility: 'Verificar minha elegibilidade',
  save: 'Salvar edital',
  saved: 'Salvo',
  officialSource: 'Fonte oficial',
  noResults: 'Nenhum edital com esses filtros. Tire um filtro.',
  loadMore: 'Carregar mais editais',
  loadingMore: 'Carregando…',
  passCardNote: 'Passe Edital: Pix ou cartão, pelo AbacatePay. Demonstração, nada é cobrado.',
};

export const CALL_NOTICE_BOARD_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    loading: 'Loading the calls…',
    published: 'On Bratura since',
    isNew: CALL_NOTICE_FLAG_LABELS.en.isNew,
    details: 'See details',
    checkEligibility: 'Check my eligibility',
    save: 'Save call',
    saved: 'Saved',
    officialSource: 'Official source',
    noResults: 'No call with these filters. Remove a filter.',
    loadMore: 'Load more calls',
    loadingMore: 'Loading…',
    passCardNote: 'Call Pass: Pix or card, through AbacatePay. Demo, nothing is charged.',
  },
};
