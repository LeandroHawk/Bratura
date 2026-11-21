import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  title: 'Perfil cultural',
  lead: 'Como você se apresenta. Um edital lê isto antes de ler o seu projeto.',
  edit: 'Editar perfil cultural',
  registrationTitle: 'Do seu cadastro',
  registrationLead: 'O que os editais são conferidos com você: quem se inscreve e onde.',
  registration: {
    email: 'E-mail',
    applicantType: 'Quem se inscreve',
    state: 'Estado',
    city: 'Cidade',
  },
  fields: {
    profileImage: 'Foto de perfil ou logotipo',
    fullName: 'Nome completo',
    artisticName: 'Nome artístico ou nome fantasia',
    mainCulturalArea: 'Área cultural principal',
    activityStartYear: 'Ano de início da atuação cultural',
    secondaryCulturalAreas: 'Áreas culturais secundárias',
    biography: 'Biografia ou apresentação',
    activityDescription: 'Descrição da atuação cultural',
    artisticLanguagesAndTechniques: 'Linguagens artísticas e técnicas',
    activityCities: 'Municípios de atuação',
    externalLinks: 'Redes sociais, site ou links externos',
  },
};

export const PROFILE_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'Cultural profile',
    lead: 'How you present yourself. A call reads this before it reads your project.',
    edit: 'Edit cultural profile',
    registrationTitle: 'From your sign-up',
    registrationLead: 'What the calls are checked against: who applies and where.',
    registration: {
      email: 'E-mail',
      applicantType: 'Who applies',
      state: 'State',
      city: 'City',
    },
    fields: {
      profileImage: 'Profile photo or logo',
      fullName: 'Full name',
      artisticName: 'Artistic or trade name',
      mainCulturalArea: 'Main cultural area',
      activityStartYear: 'Year your cultural work began',
      secondaryCulturalAreas: 'Secondary cultural areas',
      biography: 'Biography or presentation',
      activityDescription: 'Description of your cultural work',
      artisticLanguagesAndTechniques: 'Artistic languages and techniques',
      activityCities: 'Cities where you work',
      externalLinks: 'Social networks, site or external links',
    },
  },
};
