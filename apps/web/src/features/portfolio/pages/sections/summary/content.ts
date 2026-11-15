import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  greeting: 'Seu portfólio cultural',
  yearsOfActivity: (years: number) =>
    years === 0
      ? 'começou este ano'
      : years === 1
        ? '1 ano de atuação'
        : `${years} anos de atuação`,
  progressTitle: 'O que os editais mais pedem',
  progress: (done: number, total: number) => `${done} de ${total} prontos`,
  done: 'pronto',
  missing: 'falta',
  steps: {
    biography: 'Biografia ou apresentação',
    mainCulturalArea: 'Área cultural principal',
    activityStartYear: 'Ano de início da atuação',
    experience: 'Uma experiência cultural',
    project: 'Um projeto cultural',
    document: 'Um documento',
  },
};

export const SUMMARY_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    greeting: 'Your cultural portfolio',
    yearsOfActivity: (years) =>
      years === 0
        ? 'started this year'
        : years === 1
          ? '1 year of activity'
          : `${years} years of activity`,
    progressTitle: 'What calls ask for most',
    progress: (done, total) => `${done} of ${total} ready`,
    done: 'ready',
    missing: 'missing',
    steps: {
      biography: 'Biography or presentation',
      mainCulturalArea: 'Main cultural area',
      activityStartYear: 'Year your work began',
      experience: 'One cultural experience',
      project: 'One cultural project',
      document: 'One document',
    },
  },
};
