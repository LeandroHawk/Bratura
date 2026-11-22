import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

/** The product flow, written as museum wall labels: title, medium, then the description. */
const ptBR = {
  title: 'Do acervo à inscrição, em quatro salas',
  rooms: [
    {
      title: 'Seu acervo',
      medium: 'Fotos, links, documentos ou áudio',
      text: 'Você cadastra suas experiências e projetos. O que digita forma uma linha do tempo com datas, links e referências dos arquivos.',
    },
    {
      title: 'Os editais certos',
      medium: 'Mapas Culturais e sites oficiais',
      text: 'As listas usam o exemplo da Dona Maria. Abra um edital para conferir seu próprio portfólio e ver os requisitos e os trechos que os comprovam.',
    },
    {
      title: 'O que falta',
      medium: 'Em português claro',
      text: 'Valor, prazo, quem pode participar e quais documentos pedem. Os documentos estão separados em “para se inscrever” e “se for selecionado”. Onde e como tirar: em breve.',
    },
    {
      title: 'Preparação da inscrição',
      medium: 'No formato de cada chamada',
      text: 'Imprima seu portfólio e currículo a partir das experiências cadastradas. Textos sugeridos e kit no formato do edital: em breve.',
    },
  ],
};

export const HOW_IT_WORKS_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'From portfolio to application, in four rooms',
    rooms: [
      {
        title: 'Your portfolio',
        medium: 'Photos, links, documents or audio',
        text: 'Register your experiences and projects. What you type forms a dated timeline with links and file references.',
      },
      {
        title: 'The right calls',
        medium: 'Mapas Culturais and official websites',
        text: 'Lists use Dona Maria’s example. Open a call to check your own portfolio and see requirements with their supporting passages.',
      },
      {
        title: 'What is missing',
        medium: 'In plain language',
        text: 'Amount, deadline, who can apply and which documents they ask for. Documents are split into “to apply” and “if selected”. Where and how to get them: coming soon.',
      },
      {
        title: 'Preparing to apply',
        medium: 'In the format of each call',
        text: 'Print your portfolio and curriculum from registered experiences. Suggested texts and a call-specific application kit: coming soon.',
      },
    ],
  },
};
