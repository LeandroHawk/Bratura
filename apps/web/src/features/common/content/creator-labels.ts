import type { CulturalArea } from '@bratura/shared/entities/creator/enums/cultural-area/enum';
import type { CreatorProfileType } from '@bratura/shared/entities/creator/enums/profile-type/enum';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  profileType: {
    individual: 'Pessoa física',
    nonprofitLegalEntity: 'Pessoa jurídica sem fins lucrativos',
    forProfitLegalEntity: 'Pessoa jurídica com fins lucrativos',
    informalGroup: 'Grupo informal ou coletivo',
    rightsCouncil: 'Conselho de direitos',
    publicOrganization: 'Organização pública',
  } satisfies Record<CreatorProfileType, string>,
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
  notInformed: 'Não informado',
  optional: '(opcional)',
  chooseOne: 'Escolha',
};

/** Names of the contract's values and the words every form and listing repeats. */
export const CREATOR_LABELS: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    profileType: {
      individual: 'Individual',
      nonprofitLegalEntity: 'Non-profit organization',
      forProfitLegalEntity: 'For-profit company',
      informalGroup: 'Informal group or collective',
      rightsCouncil: 'Rights council',
      publicOrganization: 'Public organization',
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
    notInformed: 'Not informed',
    optional: '(optional)',
    chooseOne: 'Choose',
  },
};
