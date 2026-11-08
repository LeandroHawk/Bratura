import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

/** Accessibility features planned but not built yet, shown as rooms still being installed. */
const ptBR = {
  title: 'Próximas salas: acessibilidade',
  lead: 'Planejado para depois do essencial, se o prazo da maratona permitir.',
  plans: [
    {
      title: 'Libras',
      medium: 'VLibras, do governo federal',
      text: 'Um avatar traduz para Libras o texto que a pessoa seleciona na página. Gratuito e de código aberto.',
    },
    {
      title: 'Ouvir',
      medium: 'Voz do próprio celular ou computador',
      text: 'Um botão em cada parte importante lê o texto em voz alta, para quem enxerga mas tem dificuldade de ler. Sem custo e sem instalar nada.',
    },
  ],
};

export const FUTURE_PLANS_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'Next rooms: accessibility',
    lead: 'Planned after the essentials, if the hackathon deadline allows.',
    plans: [
      {
        title: 'Libras',
        medium: 'VLibras, by the Brazilian federal government',
        text: 'An avatar signs in Libras (Brazilian Sign Language) the text the reader selects on the page. Free and open source.',
      },
      {
        title: 'Listen',
        medium: "The phone's or computer's own voice",
        text: 'A button on each important part reads the text aloud, for people who can see the page but find reading hard. No cost, nothing to install.',
      },
    ],
  },
};
