import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  lead: 'Quem vive de artesanato, música ou arte não precisa mais caçar edital em site de governo. O Bratura lê as chamadas, explica os requisitos em português claro, mostra o que falta no seu portfólio e prepara a inscrição.',
  howItWorks: 'Como funciona',
  seeCode: 'Ver o código',
  exampleCall: {
    caption: 'Exemplo · Dona Rita, artesã (personagem fictícia)',
    name: 'Edital de Feiras de Artesanato 2027',
    issuer: 'Secretaria estadual de Cultura · vagas para artesão individual',
    open: 'Aberto até 12/12',
    soon: 'Prazo curto',
    missingBadge: 'Falta: CCMEI',
    photos: 'Fotos das peças',
    photosCount: '12 no acervo',
    yearsActive: 'Comprovar 3 anos de atividade',
    yearsActiveCount: '2 de 3 anos',
    meiCertificate: 'Certificado de MEI (CCMEI)',
    missing: 'Falta',
  },
};

export const HERO_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    lead: 'People who make a living from crafts, music or art no longer have to hunt for public calls on government websites. Bratura reads the calls, explains the requirements in plain language, shows what your portfolio is missing and gets the application ready.',
    howItWorks: 'How it works',
    seeCode: 'See the code',
    exampleCall: {
      caption: 'Example · Dona Rita, artisan (fictional character)',
      name: 'Craft Fairs Call 2027',
      issuer: 'State Department of Culture · places for individual artisans',
      open: 'Open until 12 Dec',
      soon: 'Closing soon',
      missingBadge: 'Missing: CCMEI',
      photos: 'Photos of the pieces',
      photosCount: '12 in the portfolio',
      yearsActive: 'Prove 3 years of activity',
      yearsActiveCount: '2 of 3 years',
      meiCertificate: 'MEI certificate (CCMEI)',
      missing: 'Missing',
    },
  },
};
