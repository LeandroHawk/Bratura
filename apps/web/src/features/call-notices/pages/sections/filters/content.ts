import type {
  CallNoticeCloseFilter,
  CallNoticeSort,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-cards/query';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

/** The filters over the list, and how many calls they leave on screen. */
const ptBR = {
  title: 'Filtros',
  classification: 'Compatibilidade',
  closes: 'Prazo de inscrição',
  closesOption: {
    stillOpen: 'Ainda não encerrados',
    within7Days: 'Encerram em até 7 dias',
    within30Days: 'Encerram em até 30 dias',
    closed: 'Encerrados',
  } satisfies Record<CallNoticeCloseFilter, string>,
  sort: 'Ordenar por',
  onlySaved: 'Só os editais salvos',
  any: 'Todos',
  clear: 'Limpar filtros',
  shown: (count: number, hasMore: boolean) =>
    count === 0
      ? 'Nenhum edital encontrado'
      : count === 1 && !hasMore
        ? '1 edital'
        : hasMore
          ? `${count} editais na tela, há mais`
          : `${count} editais`,
  sortOption: {
    bestFit: 'Mais compatíveis primeiro',
    closestDeadline: 'Prazo mais próximo',
    largestAmount: 'Maior valor por projeto',
    newest: 'Mais recentes',
  } satisfies Record<CallNoticeSort, string>,
};

export const CALL_NOTICE_FILTERS_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'Filters',
    classification: 'Fit',
    closes: 'Registration deadline',
    closesOption: {
      stillOpen: 'Not closed yet',
      within7Days: 'Closing within 7 days',
      within30Days: 'Closing within 30 days',
      closed: 'Closed',
    },
    sort: 'Sort by',
    onlySaved: 'Saved calls only',
    any: 'All',
    clear: 'Clear filters',
    shown: (count, hasMore) =>
      count === 0
        ? 'No call found'
        : count === 1 && !hasMore
          ? '1 call'
          : hasMore
            ? `${count} calls shown, there are more`
            : `${count} calls`,
    sortOption: {
      bestFit: 'Best fit first',
      closestDeadline: 'Closest deadline',
      largestAmount: 'Largest amount per project',
      newest: 'Newest',
    },
  },
};
