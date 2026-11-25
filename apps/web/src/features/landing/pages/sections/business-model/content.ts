import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

/**
 * Who uses Bratura and who pays for it, told as a theatre: every creator starts on stage for free;
 * those who pay sit in the audience. No prices: the pitch carries them (`features/AGENTS.md`).
 */
const ptBR = {
  /** One sentence per line, so the second never starts at the end of the first. */
  title: ['Subir ao palco é de graça.', 'Quem ganha tempo paga o ingresso.'],
  lead: 'O Bratura existe para quem não pode pagar um produtor. Por isso descobrir onde se inscrever e o que falta é grátis, sempre. Paga quem quer a inscrição montada com a gente ou cuida de muitos criadores.',
  stage: {
    title: 'Quem cria',
    price: 'R$ 0',
    priceNote: 'sempre',
    text: 'Artesão, músico, artista de teatro, de dança ou visual, muitas vezes MEI ou informal, da periferia ou do interior.',
    promise: 'Sem percentual do prêmio. Sem venda de dados.',
    includesLabel: 'Grátis, sempre',
    includes: [
      'Portfólio com link',
      'Editais em que você é apto',
      'O que falta e como tirar',
      'Aviso de prazo',
    ],
  },
  audience: {
    label: 'Na plateia, quem paga',
    channels:
      'Chegamos a eles pelo Sebrae e pelas secretarias, que já dão oficinas de edital, e pelas associações de artesãos, que trazem muitos criadores de uma vez. Os editais da PNAB abrem em épocas previsíveis.',
    rows: [
      {
        seat: 'Primeira fila',
        box: false,
        role: 'Criador ativo',
        title: 'Artistas e produtores independentes',
        pays: 'Só quando for se inscrever: por edital ou por mês, no Pix ou no cartão, pelo AbacatePay',
        text: 'O Bratura monta a inscrição com você: portfólio no formato do edital, rascunho dos textos e checklist de depois da seleção. No Pro, todos os editais.',
        demoLabel: 'Ver na demonstração, com a Dona Maria',
      },
      {
        seat: 'Fila A',
        box: false,
        role: 'Receita principal',
        title: 'Associações, cooperativas e produtoras',
        pays: 'Assinatura por faixa de perfis',
        text: 'Um painel para cuidar de muitos criadores de uma vez: inscrições em lote, os prazos da equipe e as certidões de todos em dia.',
        demoLabel: null,
      },
      {
        seat: 'Fila B',
        box: false,
        role: 'Expansão',
        title: 'Secretarias de cultura',
        pays: 'Contrato anual',
        text: 'Mais inscrições completas, menos inabilitadas e um mapa da demanda cultural da cidade. Foco nos municípios pequenos, que precisam mostrar alcance na PNAB.',
        demoLabel: null,
      },
      {
        seat: 'Camarote',
        box: true,
        role: 'Fase 2',
        title: 'Patrocinadores e parceiros',
        pays: 'Contrato anual; parceiros, por indicação',
        text: 'Empresas encontram projetos organizados para patrocinar pela Lei Rouanet ou pelo ProAC. Depois da seleção, contabilidade para MEI, conta de empresa (PJ) e certidões, só com o clique do criador.',
        demoLabel: null,
      },
    ],
  },
};

export const BUSINESS_MODEL_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: ['Getting on stage is free.', 'Those who save time buy the tickets.'],
    lead: 'Bratura exists for people who cannot pay a producer. So finding where to apply and what is missing is free, always. Those who want the application built with us, or serve many creators, pay.',
    stage: {
      title: 'Creators',
      price: 'R$ 0',
      priceNote: 'always',
      text: 'Artisans, musicians, theatre, dance and visual artists, often MEI or informal, from the outskirts or the countryside.',
      promise: 'No share of the prize. No selling of data.',
      includesLabel: 'Free, always',
      includes: [
        'Portfolio with a link',
        'Calls you qualify for',
        'What is missing and how to get it',
        'Deadline alerts',
      ],
    },
    audience: {
      label: 'In the audience, those who pay',
      channels:
        'We reach them through Sebrae and the culture departments, which already run workshops on calls, and through artisan associations, which bring many creators at once. PNAB calls open in predictable seasons.',
      rows: [
        {
          seat: 'Front row',
          box: false,
          role: 'Active creators',
          title: 'Independent artists and producers',
          pays: 'Only when applying: per call or per month, by Pix or card, through AbacatePay',
          text: "Bratura builds the application with you: the portfolio in the call's format, a draft of the texts and the checklist for after selection. With Pro, every call.",
          demoLabel: 'See it in the demo, with Dona Maria',
        },
        {
          seat: 'Row A',
          box: false,
          role: 'Main revenue',
          title: 'Associations, cooperatives and producers',
          pays: 'Subscription by number of profiles',
          text: "A panel to look after many creators at once: applications in batches, the team's deadlines and everyone's certificates up to date.",
          demoLabel: null,
        },
        {
          seat: 'Row B',
          box: false,
          role: 'Expansion',
          title: 'City culture departments',
          pays: 'Annual contract',
          text: "More complete applications, fewer disqualified ones and a map of the city's cultural demand. Focused on small towns, which must show reach under the PNAB (the national culture funding policy).",
          demoLabel: null,
        },
        {
          seat: 'Box seats',
          box: true,
          role: 'Phase 2',
          title: 'Sponsors and partners',
          pays: 'Annual contract; partners, per referral',
          text: 'Companies find organized projects to sponsor through the Rouanet law or ProAC (tax-incentive programs). After selection, MEI accounting, business bank accounts and certificates, only when the creator clicks.',
          demoLabel: null,
        },
      ],
    },
  },
};
