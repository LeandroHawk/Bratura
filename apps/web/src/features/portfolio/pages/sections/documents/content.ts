import type { PortfolioDocumentKind } from '@bratura/shared/entities/portfolio-item/enums/document-kind/enum';
import type { PortfolioDocumentStatus } from '@bratura/shared/entities/portfolio-item/kinds/document/variant';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import type { PortfolioItemsCopy } from '@/features/portfolio/pages/sections/common/PortfolioItemsSection';

const ptBR = {
  title: 'Documentação',
  lead: 'Os papéis que os editais pedem, guardados uma vez. Avisamos quando um deles vence.',
  empty: 'Nenhum documento ainda. O CPF e um comprovante de residência já abrem muitos editais.',
  add: 'Adicionar documento',
  edit: 'Editar documento',
  fields: {
    documentKind: 'Tipo de documento',
    description: 'Nome ou descrição',
    registrationNumber: 'Número de registro',
    issuedOn: 'Data de emissão',
    validUntil: 'Data de validade',
    file: 'Arquivo',
  },
  documentKind: {
    cpf: 'CPF',
    cnpj: 'CNPJ',
    ccmei: 'Certificado de MEI (CCMEI)',
    sicab: 'Registro de artesão (SICAB)',
    proofOfResidence: 'Comprovante de residência',
    proofOfCulturalExperience: 'Comprovante de atuação cultural',
    certificate: 'Certificado',
    declaration: 'Declaração',
    other: 'Outro documento',
  } satisfies Record<PortfolioDocumentKind, string>,
  status: {
    registered: 'Cadastrado',
    pending: 'Pendente',
    expired: 'Vencido',
  } satisfies Record<PortfolioDocumentStatus, string>,
  validUntil: (date: string) => `vale até ${date}`,
} satisfies PortfolioItemsCopy & Record<string, unknown>;

export const DOCUMENTS_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'Documents',
    lead: 'The papers calls ask for, stored once. We warn you when one of them expires.',
    empty: 'No document yet. The CPF and a proof of residence already open many calls.',
    add: 'Add document',
    edit: 'Edit document',
    fields: {
      documentKind: 'Type of document',
      description: 'Name or description',
      registrationNumber: 'Registration number',
      issuedOn: 'Issue date',
      validUntil: 'Expiry date',
      file: 'File',
    },
    documentKind: {
      cpf: 'CPF (taxpayer number)',
      cnpj: 'CNPJ (company number)',
      ccmei: 'MEI certificate (CCMEI)',
      sicab: 'Artisan registry (SICAB)',
      proofOfResidence: 'Proof of residence',
      proofOfCulturalExperience: 'Proof of cultural activity',
      certificate: 'Certificate',
      declaration: 'Declaration',
      other: 'Other document',
    },
    status: { registered: 'Registered', pending: 'Pending', expired: 'Expired' },
    validUntil: (date) => `valid until ${date}`,
  },
};
