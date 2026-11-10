import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

/**
 * The problem as two tickets to the same call, without and with Bratura, field by field. The price
 * stays the same on both: the call still asks for the documents; Bratura adds the way to each.
 */
const ptBR = {
  title: 'O dinheiro da cultura existe. O caminho até ele é que é difícil.',
  paragraphs: [
    'Os editais estão espalhados em dezenas de sites, escritos em linguagem jurídica dentro de PDFs, e pedem coisas que muita gente não tem: portfólio, comprovação de anos de atuação, registro de artesão (SICAB), certificado de MEI (CCMEI).',
    'Quem pode pagar um produtor se inscreve. Quem não pode perde o prazo ou é desclassificado por causa de um documento.',
  ],
  sources:
    'Nada é inventado. Todo valor, prazo e requisito vem de fonte oficial, com link: Mapas Culturais (federal, Ceará, Pernambuco e Santo André) e as páginas de editais de São Paulo e Goiás. Quando a informação não está na fonte, o Bratura diz “não informado”.',
  tickets: {
    caption: 'O ingresso de um edital, sem e com o Bratura',
    admits: 'Ingresso',
    show: 'Edital de cultura',
    priceLabel: 'Preço',
    price: ['Portfólio', 'Anos de atuação comprovados', 'SICAB', 'CCMEI'],
    without: {
      label: 'Sem o Bratura',
      showOther: 'Ver com o Bratura',
      priceNote: null,
      stamp: 'Só com produtor',
      stub: [
        { label: 'Bilheteria', value: 'dezenas de sites' },
        { label: 'Idioma', value: 'jurídico, em PDF' },
      ],
    },
    with: {
      label: 'Com o Bratura',
      showOther: 'Ver sem o Bratura',
      priceNote: 'Os mesmos documentos, com o caminho para cada um.',
      stamp: 'Inscrição pronta',
      stub: [
        { label: 'Bilheteria', value: 'um lugar só' },
        { label: 'Idioma', value: 'português claro' },
      ],
    },
  },
};

export const WHY_IT_MATTERS_CONTENT: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: {
    title: 'The money for culture exists. The road to it is the hard part.',
    paragraphs: [
      'Calls are scattered across dozens of websites, written in legal language inside PDFs, and ask for things many people do not have: a portfolio, proof of years of work, an artisan registration (SICAB), a MEI certificate (CCMEI).',
      'Those who can pay a producer apply. Those who cannot miss the deadline or are disqualified over one document.',
    ],
    sources:
      'Nothing is made up. Every amount, deadline and requirement comes from an official source, with a link: Mapas Culturais (federal, Ceará, Pernambuco and Santo André) and the calls pages of São Paulo and Goiás. When the source does not say, Bratura says “not stated”.',
    tickets: {
      caption: 'The ticket to a public call, without and with Bratura',
      admits: 'Admit one',
      show: 'Culture funding call',
      priceLabel: 'Price',
      price: ['Portfolio', 'Proven years of work', 'SICAB', 'CCMEI'],
      without: {
        label: 'Without Bratura',
        showOther: 'See it with Bratura',
        priceNote: null,
        stamp: 'Producers only',
        stub: [
          { label: 'Box office', value: 'dozens of websites' },
          { label: 'Language', value: 'legalese, in a PDF' },
        ],
      },
      with: {
        label: 'With Bratura',
        showOther: 'See it without Bratura',
        priceNote: 'The same documents, with the way to each one.',
        stamp: 'Ready to apply',
        stub: [
          { label: 'Box office', value: 'one place' },
          { label: 'Language', value: 'plain words' },
        ],
      },
    },
  },
};

export type TicketsContent = typeof ptBR.tickets;
/** The two tickets, in stacking order: the call as it is, then the same call with Bratura. */
export const TICKET_KINDS = ['without', 'with'] as const;
export type TicketKind = (typeof TICKET_KINDS)[number];
