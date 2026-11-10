import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

/** The product flow, written as museum wall labels: title, medium, then the description. */
const ptBR = {
  title: 'Do acervo à inscrição, em quatro salas',
  room: 'Sala',
  rooms: [
    {
      title: 'Seu acervo',
      medium: 'Fotos, links, documentos ou áudio',
      text: 'Você conta o que já fez do jeito que for mais fácil. A IA organiza tudo numa linha do tempo com data, e cada atividade fica guardada com a sua prova.',
    },
    {
      title: 'Os editais certos',
      medium: 'Mapas Culturais e sites oficiais',
      text: 'Seu acervo é cruzado com editais, festivais e feiras abertos. Cada um aparece como apto, quase apto ou não apto, sempre com o motivo.',
    },
    {
      title: 'O que falta',
      medium: 'Em português claro',
      text: 'Valor, prazo, quem pode participar e quais documentos pedem. Se faltar SICAB ou CCMEI, o Bratura mostra onde e como tirar.',
    },
    {
      title: 'Inscrição pronta',
      medium: 'No formato de cada chamada',
      text: 'Portfólio formatado, textos sugeridos a partir do seu próprio acervo e a lista de documentos, com aviso antes do prazo acabar.',
    },
  ],
};

export const HOW_IT_WORKS_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'From portfolio to application, in four rooms',
    room: 'Room',
    rooms: [
      {
        title: 'Your portfolio',
        medium: 'Photos, links, documents or audio',
        text: 'Tell us what you have done in whatever way is easiest. The AI arranges it into a dated timeline, and every activity is kept with its proof.',
      },
      {
        title: 'The right calls',
        medium: 'Mapas Culturais and official websites',
        text: 'Your portfolio is matched against open calls, festivals and fairs. Each one shows as eligible, almost eligible or not eligible, always with the reason.',
      },
      {
        title: 'What is missing',
        medium: 'In plain language',
        text: 'Amount, deadline, who can apply and which documents they ask for. If you lack a SICAB or CCMEI, Bratura shows where and how to get it.',
      },
      {
        title: 'Ready to apply',
        medium: 'In the format of each call',
        text: 'A formatted portfolio, texts suggested from your own work and the document checklist, with a reminder before the deadline.',
      },
    ],
  },
};
