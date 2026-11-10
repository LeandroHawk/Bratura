import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

/**
 * Who uses Bratura and who pays for it, told as a theatre: the creator is on stage and never pays;
 * those with a budget sit in the audience and buy the tickets. No prices yet: the page promises
 * nothing made up.
 */
const ptBR = {
  /** One sentence per line, so the second never starts at the end of the first. */
  title: ['O palco é de quem cria.', 'A plateia paga o ingresso.'],
  lead: 'O Bratura existe para quem não pode pagar um produtor. Por isso a conta fica com quem atende muitos criadores ou distribui o dinheiro da cultura: eles ganham quando mais gente se inscreve direito. E o grátis se sustenta: a meta é um custo de IA de centavos por inscrição, a medir no protótipo.',
  stage: {
    title: 'Quem cria',
    price: 'R$ 0',
    priceNote: 'sempre',
    text: 'Artesão, músico, artista de teatro, de dança ou visual, muitas vezes MEI ou informal, da periferia ou do interior.',
    promise: 'Sem percentual do prêmio. Sem venda de dados.',
    includesLabel: 'Tudo incluído',
    includes: ['Busca', 'Portfólio', 'O que falta', 'Kit de inscrição', 'Alertas'],
  },
  audience: {
    label: 'Na plateia, quem paga',
    channels:
      'Chegamos a eles pelo Sebrae e pelas secretarias, que já dão oficinas de edital, e pelas associações de artesãos, que trazem muitos criadores de uma vez. Os editais da PNAB abrem em épocas previsíveis.',
    rows: [
      {
        seat: 'Fila A',
        box: false,
        role: 'Receita principal',
        title: 'Associações, cooperativas e produtoras',
        pays: 'Paga por perfil gerenciado',
        text: 'Um painel para cuidar de muitos criadores de uma vez: prazos e inscrições da equipe, quem já tem o kit pronto e quem ainda tem lacuna.',
      },
      {
        seat: 'Fila B',
        box: false,
        role: 'Expansão',
        title: 'Secretarias de cultura',
        pays: 'Contrato anual',
        text: 'Mais inscrições completas, menos inabilitadas e um mapa da demanda cultural da cidade. Foco nos municípios pequenos, que precisam mostrar alcance na PNAB.',
      },
      {
        seat: 'Camarote',
        box: true,
        role: 'Fase 2',
        title: 'Empresas patrocinadoras',
        pays: 'Assinatura',
        text: 'Encontram projetos organizados, com portfólio, para patrocinar pela Lei Rouanet ou pelo ProAC.',
      },
    ],
  },
};

export const BUSINESS_MODEL_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: ['The stage belongs to creators.', 'The audience buys the tickets.'],
    lead: 'Bratura exists for people who cannot pay a producer. So the bill goes to those who serve many creators or distribute the money for culture: they win when more people apply properly. And free holds up: the target is an AI cost of cents per application, to be measured in the prototype.',
    stage: {
      title: 'Creators',
      price: 'R$ 0',
      priceNote: 'always',
      text: 'Artisans, musicians, theatre, dance and visual artists, often MEI or informal, from the outskirts or the countryside.',
      promise: 'No share of the prize. No selling of data.',
      includesLabel: 'All included',
      includes: ['Search', 'Portfolio', 'What is missing', 'Application kit', 'Alerts'],
    },
    audience: {
      label: 'In the audience, those who pay',
      channels:
        'We reach them through Sebrae and the culture departments, which already run workshops on calls, and through artisan associations, which bring many creators at once. PNAB calls open in predictable seasons.',
      rows: [
        {
          seat: 'Row A',
          box: false,
          role: 'Main revenue',
          title: 'Associations, cooperatives and producers',
          pays: 'Pay per managed profile',
          text: "A panel to look after many creators at once: the team's deadlines and applications, who already has a kit ready and who still has a gap.",
        },
        {
          seat: 'Row B',
          box: false,
          role: 'Expansion',
          title: 'City culture departments',
          pays: 'Annual contract',
          text: "More complete applications, fewer disqualified ones and a map of the city's cultural demand. Focused on small towns, which must show reach under the PNAB (the national culture funding policy).",
        },
        {
          seat: 'Box seats',
          box: true,
          role: 'Phase 2',
          title: 'Sponsoring companies',
          pays: 'Subscription',
          text: 'They find organized projects, with a portfolio, to sponsor through the Rouanet law or ProAC (tax-incentive programs).',
        },
      ],
    },
  },
};
