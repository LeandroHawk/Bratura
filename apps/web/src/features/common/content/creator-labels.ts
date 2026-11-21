import type { CulturalArea } from '@bratura/shared/entities/creator/enums/cultural-area/enum';
import type { PortfolioDocumentKind } from '@bratura/shared/entities/portfolio-item/enums/document-kind/enum';
import type { ApplicantType } from '@bratura/shared/primitives/domain/applicant-type/enum';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  applicantType: {
    individual: 'Pessoa física',
    mei: 'Microempreendedor individual (MEI)',
    company: 'Empresa',
    collectiveWithoutCnpj: 'Coletivo sem CNPJ',
    nonprofit: 'Organização sem fins lucrativos',
  } satisfies Record<ApplicantType, string>,
  culturalArea: {
    music: 'Música',
    theatre: 'Teatro',
    dance: 'Dança',
    circus: 'Circo',
    visualArts: 'Artes visuais',
    audiovisual: 'Audiovisual',
    literature: 'Literatura',
    crafts: 'Artesanato',
    popularCultures: 'Cultura popular e tradicional',
    heritage: 'Patrimônio cultural',
    photography: 'Fotografia',
    design: 'Design',
    fashion: 'Moda',
    digitalCulture: 'Cultura digital',
    other: 'Outros',
  } satisfies Record<CulturalArea, string>,
  documentKind: {
    identity: 'Documento de identidade (RG, CPF ou CNH)',
    proofOfResidence: 'Comprovante de residência',
    cnpjOrMei: 'CNPJ ou certificado de MEI (CCMEI)',
    taxAndLaborClearance: 'Certidão negativa (fiscal ou trabalhista)',
    bankAccount: 'Comprovante de conta bancária',
    portfolioOrActivityProof: 'Portfólio ou comprovante de atuação cultural',
    curriculum: 'Currículo',
    artisanCredential: 'Carteira de artesão (SICAB)',
    other: 'Outro documento',
  } satisfies Record<PortfolioDocumentKind, string>,
  notInformed: 'Não informado',
  optional: '(opcional)',
  chooseOne: 'Escolha',
};

/** Names of the contract's values and the words every form and listing repeats. */
export const CREATOR_LABELS: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    applicantType: {
      individual: 'Individual',
      mei: 'Individual microentrepreneur (MEI)',
      company: 'Company',
      collectiveWithoutCnpj: 'Collective without a CNPJ',
      nonprofit: 'Non-profit organization',
    },
    culturalArea: {
      music: 'Music',
      theatre: 'Theatre',
      dance: 'Dance',
      circus: 'Circus',
      visualArts: 'Visual arts',
      audiovisual: 'Audiovisual',
      literature: 'Literature',
      crafts: 'Crafts',
      popularCultures: 'Popular and traditional culture',
      heritage: 'Cultural heritage',
      photography: 'Photography',
      design: 'Design',
      fashion: 'Fashion',
      digitalCulture: 'Digital culture',
      other: 'Other',
    },
    documentKind: {
      identity: 'Identity document (RG, CPF or driving licence)',
      proofOfResidence: 'Proof of residence',
      cnpjOrMei: 'CNPJ or MEI certificate (CCMEI)',
      taxAndLaborClearance: 'Clearance certificate (tax or labour)',
      bankAccount: 'Proof of bank account',
      portfolioOrActivityProof: 'Portfolio or proof of cultural activity',
      curriculum: 'Curriculum',
      artisanCredential: 'Artisan card (SICAB)',
      other: 'Other document',
    },
    notInformed: 'Not informed',
    optional: '(optional)',
    chooseOne: 'Choose',
  },
};
