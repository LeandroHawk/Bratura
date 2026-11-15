import {
  CallNoticeOverviewQueryFromBraturaPortalReturnsSchema,
  type CallNoticeOverviewItem,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-overview/query';
import { callNoticeDeadline } from '@bratura/shared/entities/call-notice/fragments/registration-window/fields';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

/** A call open for this many days or fewer is closing soon. */
const CLOSES_SOON_WITHIN_DAYS = 7;

type SampleCallNotice = Omit<
  CallNoticeOverviewItem,
  | 'registrationOpens'
  | 'registrationCloses'
  | 'firstSeenAt'
  | 'lastSeenAt'
  | 'deadline'
  | 'closesSoon'
  | 'documentUrls'
  | 'officialUrl'
> & {
  /** Days from today; negative is the past, `null` is a date the call does not give. */
  opensInDays: number | null;
  closesInDays: number | null;
  firstSeenDaysAgo: number;
};

const everyApplicant = {
  value: ['individual', 'mei', 'company', 'collectiveWithoutCnpj', 'nonprofit'],
  quote: 'Podem participar pessoas físicas e jurídicas, com ou sem fins lucrativos, e coletivos.',
} satisfies NonNullable<CallNoticeOverviewItem['extraction']>['applicantTypes'];

const noAmounts = { amountsPerProject: [], totalBudget: null, evaluationCriteria: [] };

/**
 * Made-up calls that stand in for the ones ingestion stores, until the site reads Convex. None is
 * real, so none carries an amount (no number without a source) and every link goes to
 * example.com; the screens say so.
 */
const SAMPLE_CALL_NOTICES: SampleCallNotice[] = [
  {
    callNoticeId: 'exemplo-feiras-de-artesanato',
    title: 'Edital de Feiras de Artesanato 2027',
    summary:
      'Seleção de artesãs e artesãos para ocupar estandes nas feiras estaduais de artesanato ao longo de 2027.',
    organizer: 'Secretaria Estadual de Cultura (exemplo)',
    opportunityKind: 'culturalFair',
    coverage: 'state',
    state: 'CE',
    city: null,
    opensInDays: -12,
    closesInDays: 26,
    firstSeenDaysAgo: 12,
    extraction: {
      ...noAmounts,
      applicantTypes: {
        value: ['individual', 'mei'],
        quote: 'Poderão se inscrever artesãos individuais, pessoa física ou MEI.',
      },
      residenceRequirement: {
        value: 'Residir no Ceará há pelo menos 2 anos',
        quote: 'O proponente deverá comprovar residência no Estado do Ceará há, no mínimo, 2 anos.',
      },
      artForms: [{ value: 'crafts', quote: 'Destinado ao segmento do artesanato.' }],
      requiredDocuments: [
        { value: 'CPF', quote: 'Cópia do CPF do proponente.' },
        { value: 'Comprovante de residência', quote: 'Comprovante de residência atualizado.' },
        {
          value: 'Carteira do artesão (SICAB)',
          quote: 'Carteira Nacional do Artesão válida, emitida pelo SICAB.',
        },
      ],
    },
  },
  {
    callNoticeId: 'exemplo-mestres-da-cultura',
    title: 'Prêmio Mestras e Mestres da Cultura Popular',
    summary:
      'Premiação para pessoas com trajetória reconhecida na transmissão de saberes da cultura popular e tradicional.',
    organizer: 'Fundação de Cultura (exemplo)',
    opportunityKind: 'contestOrAward',
    coverage: 'national',
    state: null,
    city: null,
    opensInDays: -30,
    closesInDays: 5,
    firstSeenDaysAgo: 30,
    extraction: {
      ...noAmounts,
      applicantTypes: {
        value: ['individual'],
        quote: 'A inscrição é individual e restrita a pessoas físicas.',
      },
      residenceRequirement: null,
      artForms: [
        { value: 'popularCultures', quote: 'Saberes e fazeres das culturas populares.' },
        { value: 'crafts', quote: 'Incluído o artesanato de tradição.' },
      ],
      requiredDocuments: [
        { value: 'CPF', quote: 'Documento de identificação com CPF.' },
        {
          value: 'Comprovante de atuação cultural',
          quote: 'Comprovação de, no mínimo, 10 anos de atuação cultural.',
        },
      ],
    },
  },
  {
    callNoticeId: 'exemplo-fomento-mei-cultural',
    title: 'Chamada de Fomento ao MEI Cultural',
    summary:
      'Apoio a microempreendedores individuais da cultura para compra de material e participação em eventos.',
    organizer: 'Secretaria Municipal de Cultura (exemplo)',
    opportunityKind: 'publicCall',
    coverage: 'municipal',
    state: 'CE',
    city: 'Juazeiro do Norte',
    opensInDays: -3,
    closesInDays: 40,
    firstSeenDaysAgo: 3,
    extraction: {
      ...noAmounts,
      applicantTypes: {
        value: ['mei'],
        quote: 'Exclusivo para microempreendedores individuais (MEI) com atividade cultural.',
      },
      residenceRequirement: {
        value: 'Ter sede em Juazeiro do Norte',
        quote: 'O MEI deverá ter sede no município de Juazeiro do Norte.',
      },
      artForms: [{ value: 'any', quote: 'Aberto a todos os segmentos culturais.' }],
      requiredDocuments: [
        {
          value: 'Certificado de MEI (CCMEI)',
          quote: 'Certificado da Condição de Microempreendedor Individual (CCMEI).',
        },
        { value: 'Comprovante de residência', quote: 'Comprovante de endereço da sede.' },
      ],
    },
  },
  {
    callNoticeId: 'exemplo-festival-de-musica',
    title: 'Festival de Música Independente: seleção de shows',
    summary: 'Seleção de artistas e bandas autorais para a programação do festival.',
    organizer: 'Instituto Cultural (exemplo)',
    opportunityKind: 'festival',
    coverage: 'regional',
    state: 'PE',
    city: 'Recife',
    opensInDays: -8,
    closesInDays: 18,
    firstSeenDaysAgo: 8,
    extraction: {
      ...noAmounts,
      applicantTypes: everyApplicant,
      residenceRequirement: null,
      artForms: [{ value: 'music', quote: 'Voltado a projetos de música autoral.' }],
      requiredDocuments: [
        { value: 'CPF ou CNPJ', quote: 'Documento do proponente: CPF ou CNPJ.' },
        { value: 'Links de apresentações', quote: 'Links de vídeos de apresentações ao vivo.' },
      ],
    },
  },
  {
    callNoticeId: 'exemplo-patrocinio-empresas',
    title: 'Programa de Patrocínio a Produtoras Culturais',
    summary: 'Patrocínio privado a projetos apresentados por empresas produtoras.',
    organizer: 'Empresa patrocinadora (exemplo)',
    opportunityKind: 'privateCall',
    coverage: 'national',
    state: null,
    city: null,
    opensInDays: 4,
    closesInDays: 60,
    firstSeenDaysAgo: 1,
    extraction: {
      ...noAmounts,
      applicantTypes: {
        value: ['company'],
        quote: 'Somente pessoas jurídicas com fins lucrativos poderão apresentar projetos.',
      },
      residenceRequirement: null,
      artForms: [{ value: 'any', quote: 'Projetos de qualquer linguagem artística.' }],
      requiredDocuments: [{ value: 'CNPJ', quote: 'Cartão do CNPJ ativo.' }],
    },
  },
  {
    callNoticeId: 'exemplo-oficinas-nas-escolas',
    title: 'Edital de Oficinas Culturais nas Escolas',
    summary: null,
    organizer: null,
    opportunityKind: 'publicCall',
    coverage: null,
    state: 'CE',
    city: null,
    opensInDays: null,
    closesInDays: null,
    firstSeenDaysAgo: 2,
    // The call's documents were not read yet: only what the listing gave is known.
    extraction: null,
  },
  {
    callNoticeId: 'exemplo-circula-artes',
    title: 'Circula Artes: circulação de espetáculos',
    summary: 'Circulação de espetáculos de teatro, dança e circo por cidades do interior.',
    organizer: 'Secretaria Estadual de Cultura (exemplo)',
    opportunityKind: 'publicCall',
    coverage: 'state',
    state: 'BA',
    city: null,
    opensInDays: -50,
    closesInDays: -6,
    firstSeenDaysAgo: 50,
    extraction: {
      ...noAmounts,
      applicantTypes: everyApplicant,
      residenceRequirement: null,
      artForms: [
        { value: 'theatre', quote: 'Espetáculos de teatro.' },
        { value: 'dance', quote: 'Espetáculos de dança.' },
        { value: 'circus', quote: 'Espetáculos de circo.' },
      ],
      requiredDocuments: [],
    },
  },
];

function dayFromToday(now: number, days: number | null) {
  return days === null
    ? null
    : { at: now + days * DAY_IN_MS, timeZone: 'America/Sao_Paulo', precision: 'day' };
}

/**
 * The sample calls dated around `now`, so the demo always has open, closing and closed ones. Parsed
 * by the query's schema, as the query's answer will be.
 */
export function sampleCallNotices(now: number): CallNoticeOverviewItem[] {
  const callNotices = SAMPLE_CALL_NOTICES.map(
    ({ opensInDays, closesInDays, firstSeenDaysAgo, ...call }) => {
      const registrationCloses = dayFromToday(now, closesInDays);
      const deadline = callNoticeDeadline({ registrationCloses }, now);
      return {
        ...call,
        officialUrl: `https://example.com/editais/${call.callNoticeId}`,
        documentUrls: [],
        registrationOpens: dayFromToday(now, opensInDays),
        registrationCloses,
        firstSeenAt: now - firstSeenDaysAgo * DAY_IN_MS,
        lastSeenAt: now,
        deadline,
        closesSoon:
          deadline === 'open' && closesInDays !== null && closesInDays <= CLOSES_SOON_WITHIN_DAYS,
      };
    },
  );
  return CallNoticeOverviewQueryFromBraturaPortalReturnsSchema.parse(callNotices);
}
