import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

/**
 * The problem as two tickets to the same call, without and with Bratura, field by field. The price
 * stays the same on both: the call still asks for the documents; Bratura adds the way to each.
 */
const ptBR = {
  title: 'O dinheiro da cultura existe. O caminho até ele é que é difícil.',
  paragraphs: [
    'Os editais estão espalhados em dezenas de sites, escritos em linguagem jurídica dentro de PDFs, e pedem coisas que muita gente não tem: comprovante de residência, certidões, portfólio ou comprovação de atuação e CNPJ ou MEI.',
    'Quem pode pagar um produtor se inscreve. Quem não pode perde o prazo ou é desclassificado por causa de um documento.',
  ],
  sources:
    'Nada é inventado. Todo valor, prazo e requisito vem de fonte oficial, com link: Mapas Culturais e páginas oficiais cadastradas pela equipe. Fontes que proíbem leitura automática aparecem apenas com o link oficial. Quando a informação não está na fonte, o Bratura diz “não informado”.',
  tickets: {
    caption: 'O ingresso de um edital, sem e com o Bratura',
    admits: 'Ingresso',
    show: 'Edital de cultura',
    priceLabel: 'Preço',
    price: ['Comprovante de residência', 'Certidões', 'Portfólio ou atuação', 'CNPJ ou MEI'],
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
      priceNote: 'Os mesmos documentos, com os requisitos separados por etapa.',
      stamp: 'Requisitos claros',
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
      'Calls are scattered across dozens of websites, written in legal language inside PDFs, and ask for things many people do not have: proof of residence, clearance certificates, portfolio or activity proof, and a CNPJ or MEI.',
      'Those who can pay a producer apply. Those who cannot miss the deadline or are disqualified over one document.',
    ],
    sources:
      'Nothing is made up. Every amount, deadline and requirement comes from an official source, with a link: Mapas Culturais and official pages registered by the team. Sources that forbid automated reading show only their official link. When the source does not say, Bratura says “not stated”.',
    tickets: {
      caption: 'The ticket to a public call, without and with Bratura',
      admits: 'Admit one',
      show: 'Culture funding call',
      priceLabel: 'Price',
      price: [
        'Proof of residence',
        'Clearance certificates',
        'Portfolio or activity proof',
        'CNPJ or MEI',
      ],
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
        priceNote: 'The same documents, with requirements separated by stage.',
        stamp: 'Clear requirements',
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
