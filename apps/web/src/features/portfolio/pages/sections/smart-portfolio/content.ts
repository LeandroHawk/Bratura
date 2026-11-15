import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  title: 'Portfólio inteligente',
  lead: 'Sua trajetória montada sozinha a partir do que você cadastrou, pronta para mostrar ou imprimir.',
  timelineTitle: 'Linha do tempo',
  timelineEmpty: 'A linha do tempo aparece quando houver uma experiência com data.',
  checksTitle: 'O que conferir',
  checksLead: 'Conferência automática do que está cadastrado. Não é texto gerado por IA.',
  checks: {
    biographyMissing: 'Escreva a biografia: ela abre quase toda inscrição.',
    biographyShort: 'A biografia está curta. Conte de onde vem o seu ofício e o que você faz hoje.',
    descriptionMissing: 'Descreva a sua atuação cultural: o que você produz e para quem.',
    experiencesWithoutProof: (count: number) =>
      count === 1
        ? '1 experiência está sem foto ou comprovante.'
        : `${count} experiências estão sem foto ou comprovante.`,
    experiencesWithoutDate: (count: number) =>
      count === 1 ? '1 experiência está sem data.' : `${count} experiências estão sem data.`,
    allGood: 'Nada a apontar no que está cadastrado.',
  },
  aiTitle: 'Texto com IA',
  aiLead:
    'A IA vai sugerir melhorias na biografia e nas descrições a partir do seu portfólio. Entra quando o Bratura estiver ligado ao servidor: aqui nada é inventado.',
  generateWithAi: 'Gerar ou atualizar com IA',
  exportPdf: 'Exportar em PDF',
  exportHint: 'Abre a impressão do navegador: escolha "Salvar como PDF".',
};

export const SMART_PORTFOLIO_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'Smart portfolio',
    lead: 'Your path put together by itself from what you registered, ready to show or print.',
    timelineTitle: 'Timeline',
    timelineEmpty: 'The timeline appears once an experience has a date.',
    checksTitle: 'What to check',
    checksLead: 'An automatic check of what is registered. This is not AI-generated text.',
    checks: {
      biographyMissing: 'Write the biography: it opens almost every application.',
      biographyShort:
        'The biography is short. Say where your craft comes from and what you do today.',
      descriptionMissing: 'Describe your cultural work: what you make and for whom.',
      experiencesWithoutProof: (count) =>
        count === 1
          ? '1 experience has no photo or proof.'
          : `${count} experiences have no photo or proof.`,
      experiencesWithoutDate: (count) =>
        count === 1 ? '1 experience has no date.' : `${count} experiences have no date.`,
      allGood: 'Nothing to point out in what is registered.',
    },
    aiTitle: 'Text with AI',
    aiLead:
      'AI will suggest improvements to the biography and descriptions from your portfolio. It arrives when Bratura is connected to the server: nothing here is invented.',
    generateWithAi: 'Generate or update with AI',
    exportPdf: 'Export as PDF',
    exportHint: 'Opens the browser’s print dialog: choose "Save as PDF".',
  },
};
