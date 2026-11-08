import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const ptBR = {
  title: 'O dinheiro da cultura existe. O caminho até ele é que é difícil.',
  paragraphs: [
    'Os editais estão espalhados em dezenas de sites, escritos em linguagem jurídica dentro de PDFs, e pedem coisas que muita gente não tem: portfólio, comprovação de anos de atuação, registro de artesão (SICAB), certificado de MEI (CCMEI).',
    'Quem pode pagar um produtor se inscreve. Quem não pode perde o prazo ou é desclassificado por causa de um documento.',
  ],
  sources:
    'Nada é inventado. Todo valor, prazo e requisito vem de fonte oficial, com link: Mapas Culturais (federal, Ceará, Pernambuco e Santo André) e as páginas de editais de São Paulo e Goiás. Quando a informação não está na fonte, o Bratura diz “não informado”.',
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
  },
};
