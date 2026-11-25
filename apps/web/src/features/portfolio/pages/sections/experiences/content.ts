import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import type { PortfolioItemsCopy } from '@/features/portfolio/pages/sections/common/PortfolioItemsSection';

const ptBR = {
  title: 'Experiências culturais',
  lead: 'Apresentações, feiras, oficinas: o que comprova o seu tempo de atuação quando um edital pede.',
  empty: 'Nenhuma experiência ainda. Comece pela mais recente.',
  add: 'Adicionar experiência',
  edit: 'Editar experiência',
  fields: {
    title: 'Título da experiência',
    activityKind: 'Tipo de atividade',
    organizer: 'Instituição ou organização responsável',
    startDate: 'Data de início',
    endDate: 'Data de término',
    venue: 'Local de realização',
    city: 'Cidade',
    state: 'Estado',
    description: 'Descrição',
    links: 'Links de vídeos e páginas',
    attachments: 'Fotografias, áudios e comprovantes',
  },
} satisfies PortfolioItemsCopy & Record<string, unknown>;

export const EXPERIENCES_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'Cultural experiences',
    lead: 'Shows, fairs, workshops: what proves your years of activity when a call asks for it.',
    empty: 'No experience yet. Start with the most recent one.',
    add: 'Add experience',
    edit: 'Edit experience',
    fields: {
      title: 'Title of the experience',
      activityKind: 'Type of activity',
      organizer: 'Institution or organization in charge',
      startDate: 'Start date',
      endDate: 'End date',
      venue: 'Venue',
      city: 'City',
      state: 'State',
      description: 'Description',
      links: 'Links to videos and pages',
      attachments: 'Photos, audios and proofs',
    },
  },
};
