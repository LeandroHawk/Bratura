import type { PortfolioDocumentStatus } from '@bratura/shared/entities/portfolio-item/kinds/document/variant';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import type { PortfolioItemsCopy } from '@/features/portfolio/pages/sections/common/PortfolioItemsSection';

const ptBR = {
  title: 'Documentação',
  lead: 'Os papéis que os editais pedem, guardados uma vez. Um papel vencido ou perto de vencer aparece marcado aqui e nos detalhes dos editais que o pedem; as listas usam o exemplo da Dona Maria.',
  empty:
    'Nenhum documento ainda. Um documento de identidade e um comprovante de residência já abrem muitos editais.',
  add: 'Adicionar documento',
  edit: 'Editar documento',
  fields: {
    documentKind: 'Tipo de documento',
    description: 'Nome ou descrição',
    issuedOn: 'Data de emissão',
    validUntil: 'Data de validade',
    file: 'Arquivo',
  },
  status: {
    registered: 'Cadastrado',
    expiring: 'Vence em breve',
    pending: 'Pendente',
    expired: 'Vencido',
  } satisfies Record<PortfolioDocumentStatus, string>,
  validUntil: (date: string) => `vale até ${date}`,
} satisfies PortfolioItemsCopy & Record<string, unknown>;

export const DOCUMENTS_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'Documents',
    lead: 'The papers calls ask for, stored once. A paper that expired or is about to is marked here and in the details of calls that ask for it; lists use Dona Maria’s example.',
    empty:
      'No document yet. An identity document and a proof of residence already open many calls.',
    add: 'Add document',
    edit: 'Edit document',
    fields: {
      documentKind: 'Type of document',
      description: 'Name or description',
      issuedOn: 'Issue date',
      validUntil: 'Expiry date',
      file: 'File',
    },
    status: {
      registered: 'Registered',
      expiring: 'Expires soon',
      pending: 'Pending',
      expired: 'Expired',
    },
    validUntil: (date) => `valid until ${date}`,
  },
};
