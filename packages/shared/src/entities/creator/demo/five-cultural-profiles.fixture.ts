import { CreatorSchema } from '../entity';
import { FICTIONAL_CREATOR } from './fictional-creator';
import { PortfolioItemSchema } from '../../portfolio-item/entity';

/** Isolated QA identities; these accounts are never inserted in a production deployment. */
export const CULTURAL_QA_PROFILES = [
  {
    key: 'actor',
    name: 'Ator QA',
    applicantType: 'individual',
    area: 'theatre',
    years: 5,
    technique: 'teatro',
    description:
      'Peças teatrais, apresentações culturais, produções independentes e eventos artísticos.',
  },
  {
    key: 'comedy',
    name: 'Grupo de Comédia QA',
    applicantType: 'collectiveWithoutCnpj',
    area: 'theatre',
    years: null,
    technique: 'comédia',
    description: 'Peças humorísticas, apresentações coletivas e eventos culturais.',
  },
  {
    key: 'mpb',
    name: 'Banda MPB QA',
    applicantType: 'collectiveWithoutCnpj',
    area: 'music',
    years: null,
    technique: 'MPB',
    description: 'Cantor acompanhado de banda, shows ao vivo, festivais e projetos musicais.',
  },
  {
    key: 'artisan',
    name: 'Artesão QA',
    applicantType: 'individual',
    area: 'crafts',
    years: 20,
    technique: 'artesanato',
    description:
      'Produção e comercialização artesanal, feiras locais, exposições e atividades comunitárias.',
  },
  {
    key: 'producer',
    name: 'Produtor Cultural QA',
    applicantType: 'individual',
    area: 'other',
    years: 10,
    technique: 'produção e gestão cultural',
    description:
      'Planejamento de eventos, produção de festivais, propostas e coordenação de projetos culturais.',
  },
].map(({ key, name, applicantType, area, years, technique, description }) => ({
  key,
  years,
  creator: CreatorSchema.parse({
    ...FICTIONAL_CREATOR,
    email: `${key}@bratura.example.test`,
    fullName: name,
    artisticName: name,
    applicantType,
    mainCulturalArea: area,
    secondaryCulturalAreas: [],
    artisticLanguagesAndTechniques: [technique],
    activityDescription: description,
    biography: description,
    activityStartYear: years === null ? null : 2026 - years,
    externalLinks: [],
  }),
  portfolioItems: [
    PortfolioItemSchema.parse({
      kind: 'culturalExperience',
      clientItemId: `qa-${key}-experience`,
      title: `Projeto fictício de ${name}`,
      activityKind: 'culturalEvent',
      description,
      startDate: '2025-01-01',
      endDate: '2025-02-01',
      venue: 'Espaço fictício QA',
      city: 'Juazeiro do Norte',
      state: 'CE',
      organizer: null,
      links: [`https://bratura.example.test/${key}`],
      attachments: [],
    }),
  ],
}));
