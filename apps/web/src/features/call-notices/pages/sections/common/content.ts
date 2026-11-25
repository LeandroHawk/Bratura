import type { MatchClassification } from '@bratura/shared/entities/match/enums/classification/enum';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import type { CallNoticeStatus } from './callNoticeTexts';
import { CALL_NOTICE_FLAG_LABELS } from '@/features/common/content/call-notice-flags';

/** What the board and the details both say of a call: status, fit, key facts, the pass. */
const ptBR = {
  anyArtForm: 'Todas as áreas culturais',
  openEndedClose: 'sem data de encerramento',
  status: {
    open: 'Aberto',
    closingSoon: CALL_NOTICE_FLAG_LABELS['pt-BR'].closesSoon,
    openEnded: 'Sem data para encerrar',
    closed: 'Encerrado',
    notInformed: 'Prazo não informado',
  } satisfies Record<CallNoticeStatus, string>,
  classification: {
    eligible: 'Elegível',
    almostEligible: 'Quase elegível',
    notEligible: 'Não elegível',
  } satisfies Record<MatchClassification, string>,
  facts: {
    organizer: 'Quem publica',
    amount: 'Maior valor por projeto',
    opens: 'Abertura das inscrições',
    deadline: 'Prazo final para inscrição',
  },
  passCta: 'Montar minha inscrição',
};

export const CALL_NOTICE_LABELS: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    anyArtForm: 'Every cultural area',
    openEndedClose: 'no closing date',
    status: {
      open: 'Open',
      closingSoon: CALL_NOTICE_FLAG_LABELS.en.closesSoon,
      openEnded: 'No closing date',
      closed: 'Closed',
      notInformed: 'Deadline not informed',
    },
    classification: {
      eligible: 'Eligible',
      almostEligible: 'Almost eligible',
      notEligible: 'Not eligible',
    },
    facts: {
      organizer: 'Published by',
      amount: 'Largest amount per project',
      opens: 'Registration opens',
      deadline: 'Final registration deadline',
    },
    passCta: 'Build my application',
  },
};
