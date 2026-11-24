import type {
  CallNoticeCloseFilter,
  CallNoticeSort,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-cards/query';
import type { EligibilityRuleKind } from '@bratura/shared/entities/call-notice/enums/eligibility-rule/enum';
import type { QuotaGroup } from '@bratura/shared/entities/call-notice/enums/quota-group/enum';
import type {
  MatchCheckStatus,
  MatchPaperValidity,
} from '@bratura/shared/entities/match/enums/check-status/enum';
import type { MatchClassification } from '@bratura/shared/entities/match/enums/classification/enum';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import type { CallNoticeStatus } from './callNoticeTexts';

const ptBR = {
  fictionalProfileNotice:
    'As listas e contadores usam o portfólio fictício da Dona Maria. Os detalhes conferem o seu portfólio deste navegador.',
  unavailable: 'Os editais estão indisponíveis no momento. Tente atualizar a página mais tarde.',
  loading: 'Carregando os editais…',
  anyArtForm: 'Todas as áreas culturais',
  openEndedClose: 'sem data de encerramento',
  status: {
    open: 'Aberto',
    closingSoon: 'Encerrando em breve',
    openEnded: 'Sem data para encerrar',
    closed: 'Encerrado',
    notInformed: 'Prazo não informado',
  } satisfies Record<CallNoticeStatus, string>,
  classification: {
    eligible: 'Elegível',
    almostEligible: 'Quase elegível',
    notEligible: 'Não elegível',
  } satisfies Record<MatchClassification, string>,
  notAnalyzed: 'Ainda não analisado',
  filters: {
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
    noResults: 'Nenhum edital com esses filtros. Tire um filtro.',
    loadMore: 'Carregar mais editais',
    loadingMore: 'Carregando…',
  },
  sort: {
    closestDeadline: 'Prazo mais próximo',
    largestAmount: 'Maior valor por projeto',
    newest: 'Mais recentes',
  } satisfies Record<CallNoticeSort, string>,
  card: {
    organizer: 'Quem publica',
    amount: 'Maior valor por projeto',
    published: 'No Bratura desde',
    opens: 'Abertura das inscrições',
    closes: 'Encerramento das inscrições',
    isNew: 'Novo',
    details: 'Ver detalhes',
    checkEligibility: 'Verificar minha elegibilidade',
    save: 'Salvar edital',
    saved: 'Salvo',
    officialSource: 'Fonte oficial',
  },
  eligibilityRuleKind: {
    minimumAge: 'Idade mínima',
    maximumAge: 'Idade máxima',
    residenceTime: 'Tempo de residência',
    careerStage: 'Momento da carreira',
    minimumExperience: 'Tempo mínimo de atuação',
    awardRestriction: 'Restrição a premiados',
    publicServantExclusion: 'Vedação a servidores públicos',
    conflictOfInterest: 'Conflito de interesse',
    maxProposalsPerApplicant: 'Limite de propostas por pessoa',
    workRestriction: 'Restrição sobre a obra',
    themeRestriction: 'Restrição de tema',
    organizationRequirement: 'Exigência para organizações',
    counterpart: 'Contrapartida',
    other: 'Outra regra',
  } satisfies Record<EligibilityRuleKind, string>,
  quotaGroup: {
    black: 'Pessoas negras',
    indigenous: 'Pessoas indígenas',
    quilombola: 'Quilombolas',
    traditionalPeoples: 'Povos e comunidades tradicionais',
    disabled: 'Pessoas com deficiência',
    women: 'Mulheres',
    lgbtqia: 'Pessoas LGBTQIA+',
    elderly: 'Pessoas idosas',
    youth: 'Jovens',
    other: 'Outro grupo',
  } satisfies Record<QuotaGroup, string>,
  details: {
    loading: 'Carregando o edital…',
    aboutTitle: 'Sobre o edital',
    summary: 'Descrição',
    artForms: 'Categoria cultural',
    applicantTypes: 'Quem pode se inscrever',
    residence: 'Onde morar ou atuar',
    totalBudget: 'Valor total do edital',
    amountPerProject: 'Valor por projeto',
    lastUpdated: 'Visto na fonte pela última vez',
    criteria: 'Critérios de avaliação',
    maxPoints: (points: number) => `até ${points} pontos`,
    resultPosted: 'A fonte já publicou o resultado deste edital.',
    notRead:
      'Os documentos deste edital não foram lidos pelo Bratura (a fonte não permite a leitura automática, ou ela ainda não aconteceu). Confira tudo na página oficial.',
    notCreatorCall:
      'Este edital não parece ser para artistas e grupos com projeto próprio: não conferimos a sua elegibilidade.',
    eligibilityTitle: 'Análise de elegibilidade',
    eligibilityLead:
      'Conferência por regras objetivas, item a item, com o trecho do edital que pede cada um.',
    quoteLabel: 'O edital diz:',
    checkStatus: {
      met: 'Atendido',
      notMet: 'Não atendido',
      needsConfirmation: 'Para você conferir',
    } satisfies Record<MatchCheckStatus, string>,
    paperStatus: {
      met: 'Você já tem',
      notMet: 'Falta',
      needsConfirmation: 'Para você conferir',
    } satisfies Record<MatchCheckStatus, string>,
    paperValidity: {
      valid: null,
      expiresBeforeClose: 'O seu documento vence antes do fim das inscrições: renove antes.',
      expired: 'O documento do seu portfólio está vencido.',
    } satisfies Record<MatchPaperValidity, string | null>,
    applicantTypeTitle: 'Quem pode se inscrever',
    applicantTypeToConfirm:
      'O seu tipo de inscrição não está na lista que lemos. A lista pode estar incompleta: confira no edital.',
    artFormToConfirm:
      'As áreas culturais do seu perfil não estão entre as que lemos neste edital: confira no edital.',
    toApplyTitle: 'Para se inscrever',
    afterSelectionTitle: 'Se for selecionado',
    afterSelectionLead: 'Pedidos só depois do resultado: não contam para a sua elegibilidade.',
    listNone: 'O edital não lista nenhum.',
    rulesTitle: 'Regras de participação',
    quotasTitle: 'Vagas reservadas',
    quotasLead:
      'O Bratura não guarda autodeclaração: confira no edital se você se enquadra em alguma.',
    quotaShare: 'Reserva',
    updatePortfolio: 'Atualizar meu portfólio',
    annexesTitle: 'Página oficial e anexos',
    officialPage: 'Acessar a página oficial de inscrição',
    annex: (position: number) => `Anexo ${position}`,
    deadline: 'Prazo final para inscrição',
    aiTitle: 'Onde tirar cada documento e textos sugeridos',
    aiLead: 'Em breve. Nada aqui é inventado: enquanto não existir, não aparece.',
    alertsTitle: 'Alertas e acompanhamento',
    alertsLead:
      'Nesta demonstração a escolha fica guardada neste navegador e nenhuma mensagem é enviada. Com a conta, o lembrete chega pelo canal que você ativar (hoje, o Telegram).',
    saveCall: 'Salvar este edital',
    reminders: 'Lembrar do prazo de inscrição',
    close: 'Fechar',
  },
};

export const CALL_NOTICES_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    fictionalProfileNotice:
      'Lists and counters use Dona Maria’s fictional portfolio. Details check your portfolio from this browser.',
    unavailable: 'Calls are unavailable at the moment. Try reloading the page later.',
    loading: 'Loading the calls…',
    anyArtForm: 'Every cultural area',
    openEndedClose: 'no closing date',
    status: {
      open: 'Open',
      closingSoon: 'Closing soon',
      openEnded: 'No closing date',
      closed: 'Closed',
      notInformed: 'Deadline not informed',
    },
    classification: {
      eligible: 'Eligible',
      almostEligible: 'Almost eligible',
      notEligible: 'Not eligible',
    },
    notAnalyzed: 'Not analyzed yet',
    filters: {
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
      noResults: 'No call with these filters. Remove a filter.',
      loadMore: 'Load more calls',
      loadingMore: 'Loading…',
    },
    sort: {
      closestDeadline: 'Closest deadline',
      largestAmount: 'Largest amount per project',
      newest: 'Newest',
    },
    card: {
      organizer: 'Published by',
      amount: 'Largest amount per project',
      published: 'On Bratura since',
      opens: 'Registration opens',
      closes: 'Registration closes',
      isNew: 'New',
      details: 'See details',
      checkEligibility: 'Check my eligibility',
      save: 'Save call',
      saved: 'Saved',
      officialSource: 'Official source',
    },
    eligibilityRuleKind: {
      minimumAge: 'Minimum age',
      maximumAge: 'Maximum age',
      residenceTime: 'Time of residence',
      careerStage: 'Career stage',
      minimumExperience: 'Minimum time of activity',
      awardRestriction: 'Restriction on past winners',
      publicServantExclusion: 'Public servants barred',
      conflictOfInterest: 'Conflict of interest',
      maxProposalsPerApplicant: 'Limit of proposals per applicant',
      workRestriction: 'Restriction on the work',
      themeRestriction: 'Theme restriction',
      organizationRequirement: 'Requirement for organizations',
      counterpart: 'Counterpart',
      other: 'Other rule',
    },
    quotaGroup: {
      black: 'Black people',
      indigenous: 'Indigenous people',
      quilombola: 'Quilombolas',
      traditionalPeoples: 'Traditional peoples and communities',
      disabled: 'People with disabilities',
      women: 'Women',
      lgbtqia: 'LGBTQIA+ people',
      elderly: 'Elderly people',
      youth: 'Young people',
      other: 'Other group',
    },
    details: {
      loading: 'Loading the call…',
      aboutTitle: 'About the call',
      summary: 'Description',
      artForms: 'Cultural category',
      applicantTypes: 'Who can apply',
      residence: 'Where to live or work',
      totalBudget: 'The call’s total amount',
      amountPerProject: 'Amount per project',
      lastUpdated: 'Last seen at the source',
      criteria: 'Evaluation criteria',
      maxPoints: (points) => `up to ${points} points`,
      resultPosted: 'The source has already posted this call’s result.',
      notRead:
        'Bratura did not read this call’s documents (the source does not allow automated reading, or it has not happened yet). Check everything on the official page.',
      notCreatorCall:
        'This call does not seem to be for artists and groups with their own project: we did not check your eligibility.',
      eligibilityTitle: 'Eligibility analysis',
      eligibilityLead:
        'Checked by objective rules, item by item, with the passage of the call that asks for each.',
      quoteLabel: 'The call says:',
      checkStatus: { met: 'Met', notMet: 'Not met', needsConfirmation: 'For you to check' },
      paperStatus: {
        met: 'You already have it',
        notMet: 'Missing',
        needsConfirmation: 'For you to check',
      },
      paperValidity: {
        valid: null,
        expiresBeforeClose: 'Your document expires before registration closes: renew it first.',
        expired: 'The document in your portfolio has expired.',
      },
      applicantTypeTitle: 'Who can apply',
      applicantTypeToConfirm:
        'Your applicant type is not on the list we read. The list may be incomplete: check the call.',
      artFormToConfirm:
        'The cultural areas of your profile are not among those we read in this call: check the call.',
      toApplyTitle: 'To apply',
      afterSelectionTitle: 'If you are selected',
      afterSelectionLead: 'Asked only after the result: they do not count for your eligibility.',
      listNone: 'The call lists none.',
      rulesTitle: 'Participation rules',
      quotasTitle: 'Reserved places',
      quotasLead:
        'Bratura keeps no self-declaration: check in the call whether one applies to you.',
      quotaShare: 'Reserved',
      updatePortfolio: 'Update my portfolio',
      annexesTitle: 'Official page and annexes',
      officialPage: 'Go to the official registration page',
      annex: (position) => `Annex ${position}`,
      deadline: 'Final registration deadline',
      aiTitle: 'Where to get each document and suggested texts',
      aiLead: 'Coming soon. Nothing here is invented: until it exists, it does not show.',
      alertsTitle: 'Alerts and follow-up',
      alertsLead:
        'In this demo the choice is kept in this browser and no message is sent. With an account, the reminder arrives through the channel you turn on (today, Telegram).',
      saveCall: 'Save this call',
      reminders: 'Remind me of the registration deadline',
      close: 'Close',
    },
  },
};
