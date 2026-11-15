import type { CulturalProjectStatus } from '@bratura/shared/entities/portfolio-item/enums/project-status/enum';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import type { PortfolioItemsCopy } from '@/features/portfolio/pages/sections/common/PortfolioItemsSection';

const ptBR = {
  title: 'Projetos culturais',
  lead: 'O que você quer fazer, está fazendo ou já fez. É daqui que sai o texto do projeto na inscrição.',
  empty: 'Nenhum projeto ainda. Pode ser uma ideia: marque como planejado.',
  add: 'Adicionar projeto',
  edit: 'Editar projeto',
  fields: {
    name: 'Nome do projeto',
    culturalArea: 'Categoria cultural',
    status: 'Situação do projeto',
    startDate: 'Data de início',
    endDate: 'Data de término',
    venue: 'Local de realização',
    targetAudience: 'Público-alvo',
    description: 'Descrição do projeto',
    objective: 'Objetivo',
    results: 'Resultados alcançados',
    links: 'Links externos',
    attachments: 'Fotografias, vídeos, áudios e comprovantes',
  },
  status: {
    planned: 'Planejado',
    inProgress: 'Em andamento',
    completed: 'Concluído',
  } satisfies Record<CulturalProjectStatus, string>,
} satisfies PortfolioItemsCopy & Record<string, unknown>;

export const PROJECTS_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'Cultural projects',
    lead: 'What you want to do, are doing or have done. The project text of an application comes from here.',
    empty: 'No project yet. It can be an idea: mark it as planned.',
    add: 'Add project',
    edit: 'Edit project',
    fields: {
      name: 'Project name',
      culturalArea: 'Cultural category',
      status: 'Project status',
      startDate: 'Start date',
      endDate: 'End date',
      venue: 'Venue',
      targetAudience: 'Target audience',
      description: 'Project description',
      objective: 'Objective',
      results: 'Results achieved',
      links: 'External links',
      attachments: 'Photos, videos, audios and proofs',
    },
    status: { planned: 'Planned', inProgress: 'In progress', completed: 'Completed' },
  },
};
