import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

/**
 * Accessibility features planned but not built yet: other ways through the same rooms, not new
 * ones. `isEntrance` places a plan on the floor plan: a second door, or a feature of every room.
 */
const ptBR = {
  title: 'Outras formas de visitar',
  lead: 'Planejado para depois do essencial, se o prazo da maratona permitir.',
  floorPlan: {
    label:
      'Planta do Bratura: as quatro salas, Libras e Ouvir em todas elas, e duas entradas, o site e o WhatsApp.',
    room: 'Sala',
    everyRoom: 'Em todas as salas',
    website: 'Site',
    essentials: 'O essencial',
    afterEssentials: 'Depois do essencial',
  },
  plans: [
    {
      title: 'Libras',
      isEntrance: false,
      medium: 'VLibras, do governo federal',
      text: 'Um avatar traduz para Libras o texto que a pessoa seleciona na página. Gratuito e de código aberto.',
    },
    {
      title: 'Ouvir',
      isEntrance: false,
      medium: 'Voz do próprio celular ou computador',
      text: 'Um botão em cada parte importante lê o texto em voz alta, para quem enxerga mas tem dificuldade de ler. Sem custo e sem instalar nada.',
    },
    {
      title: 'WhatsApp',
      isEntrance: true,
      medium: 'O mesmo Bratura, no app que você já usa',
      text: 'Com o acervo já montado no site, veja pela conversa os editais em que você é apto, faça a inscrição e receba aviso assim que um edital novo abrir.',
    },
  ],
};

export const FUTURE_PLANS_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'Other ways to visit',
    lead: 'Planned after the essentials, if the hackathon deadline allows.',
    floorPlan: {
      label:
        'Floor plan of Bratura: the four rooms, Libras and Listen in all of them, and two entrances, the website and WhatsApp.',
      room: 'Room',
      everyRoom: 'In every room',
      website: 'Website',
      essentials: 'The essentials',
      afterEssentials: 'After the essentials',
    },
    plans: [
      {
        title: 'Libras',
        isEntrance: false,
        medium: 'VLibras, by the Brazilian federal government',
        text: 'An avatar signs in Libras (Brazilian Sign Language) the text the reader selects on the page. Free and open source.',
      },
      {
        title: 'Listen',
        isEntrance: false,
        medium: "The phone's or computer's own voice",
        text: 'A button on each important part reads the text aloud, for people who can see the page but find reading hard. No cost, nothing to install.',
      },
      {
        title: 'WhatsApp',
        isEntrance: true,
        medium: 'The same Bratura, in the app you already use',
        text: 'Once your portfolio is set up on the site, see the calls you are eligible for, apply, and get an alert as soon as a new call opens, all in the chat.',
      },
    ],
  },
};
