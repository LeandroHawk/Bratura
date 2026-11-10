import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

/** Accessibility features planned but not built yet: other ways through the same rooms, not new ones. */
const ptBR = {
  title: 'Outras formas de visitar',
  lead: 'Planejado para depois do essencial, se o prazo da maratona permitir.',
  floorPlan: {
    label: (inEveryRoom: string, entrances: string) =>
      `Planta do Bratura: ${inEveryRoom} em todas as salas. Entradas: ${entrances}.`,
    everyRoom: 'Em todas as salas',
    website: 'Site',
    essentials: 'O essencial',
    afterEssentials: 'Depois do essencial',
  },
  plans: {
    libras: {
      title: 'Libras',
      medium: 'VLibras, do governo federal',
      text: 'Um avatar traduz para Libras o texto que a pessoa seleciona na página. Gratuito e de código aberto.',
    },
    listen: {
      title: 'Ouvir',
      medium: 'Voz do próprio celular ou computador',
      text: 'Um botão em cada parte importante lê o texto em voz alta, para quem enxerga mas tem dificuldade de ler. Sem custo e sem instalar nada.',
    },
    whatsapp: {
      title: 'WhatsApp',
      medium: 'O mesmo Bratura, no app que você já usa',
      text: 'Com o acervo já montado no site, veja pela conversa os editais em que você é apto, faça a inscrição e receba aviso assim que um edital novo abrir.',
    },
  },
};

export type FuturePlanId = keyof typeof ptBR.plans;

export const FUTURE_PLANS_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'Other ways to visit',
    lead: 'Planned after the essentials, if the hackathon deadline allows.',
    floorPlan: {
      label: (inEveryRoom, entrances) =>
        `Floor plan of Bratura: ${inEveryRoom} in every room. Entrances: ${entrances}.`,
      everyRoom: 'In every room',
      website: 'Website',
      essentials: 'The essentials',
      afterEssentials: 'After the essentials',
    },
    plans: {
      libras: {
        title: 'Libras',
        medium: 'VLibras, by the Brazilian federal government',
        text: 'An avatar signs in Libras (Brazilian Sign Language) the text the reader selects on the page. Free and open source.',
      },
      listen: {
        title: 'Listen',
        medium: "The phone's or computer's own voice",
        text: 'A button on each important part reads the text aloud, for people who can see the page but find reading hard. No cost, nothing to install.',
      },
      whatsapp: {
        title: 'WhatsApp',
        medium: 'The same Bratura, in the app you already use',
        text: 'Once your portfolio is set up on the site, see the calls you are eligible for, apply, and get an alert as soon as a new call opens, all in the chat.',
      },
    },
  },
};
