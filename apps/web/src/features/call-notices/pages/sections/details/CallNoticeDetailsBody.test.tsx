import {
  CallNoticeDetailsSchema,
  type CallNoticeDetails,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-details/query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { CallNoticeDetailsBody } from './CallNoticeDetailsBody';

const quote = 'trecho do edital';

const notRead: CallNoticeDetails = CallNoticeDetailsSchema.parse({
  callNoticeId: 'callNotices-id',
  title: 'Edital de Artesanato 2026',
  officialUrl: 'https://cultura.example.gov.br/edital',
  registrationOpens: null,
  registrationCloses: {
    at: Date.UTC(2026, 11, 1, 2, 59),
    precision: 'minute',
    timeZone: 'America/Sao_Paulo',
  },
  firstSeenAt: Date.UTC(2026, 10, 1),
  lastSeenAt: Date.UTC(2026, 10, 20),
  organizer: 'Secretaria de Cultura',
  deadline: 'open',
  closesSoon: false,
  isNew: false,
  largestAmountPerProjectInCents: null,
  artForms: [],
  summary: null,
  documentUrls: ['https://cultura.example.gov.br/files/edital.pdf'],
  documentLabels: [
    {
      url: 'https://cultura.example.gov.br/files/edital.pdf',
      label: 'Edital 02/2026 - Retificado',
    },
  ],
  extraction: null,
  classification: null,
  matchChecks: null,
});

const read: CallNoticeDetails = {
  ...notRead,
  largestAmountPerProjectInCents: 1_500_000,
  classification: 'almostEligible',
  extraction: {
    isCreatorCall: { value: true, quote },
    amountsPerProject: [{ category: 'Artesanato', amountInCents: 1_500_000, quote }],
    totalBudget: { amountInCents: 90_000_000, quote },
    applicantTypes: { value: ['individual', 'mei'], quote },
    residenceRequirement: null,
    artForms: [{ value: 'crafts', quote }],
    requirements: [],
    eligibilityRules: [],
    quotas: [{ group: 'women', share: '20%', quote: 'reserva de 20% para mulheres' }],
    evaluationCriteria: [],
    extractedAt: Date.UTC(2026, 10, 19),
  },
  matchChecks: {
    residence: null,
    applicantType: { value: ['individual', 'mei'], quote, status: 'met' },
    artFormStatus: 'met',
    requirements: [
      {
        kind: 'identity',
        detail: 'RG ou CNH',
        stage: 'registration',
        quote: 'cópia do RG',
        status: 'met',
        paperValidity: 'valid',
      },
      {
        kind: 'identity',
        detail: 'CPF',
        stage: null,
        quote: 'cópia do CPF',
        status: 'notMet',
        paperValidity: null,
      },
      {
        kind: 'taxAndLaborClearance',
        detail: 'CND federal',
        stage: 'afterSelection',
        quote: 'certidão negativa',
        status: 'met',
        paperValidity: 'expiresBeforeClose',
      },
    ],
    eligibilityRules: [
      { kind: 'minimumAge', detail: '18 anos', quote: 'maiores de 18 anos', status: 'met' },
    ],
  },
};

const text = (details: CallNoticeDetails) =>
  renderToStaticMarkup(<CallNoticeDetailsBody locale="pt-BR" details={details} />);

describe('CallNoticeDetailsBody', () => {
  test.each(['pt-BR', 'en'] as const)(
    'shows the residence decision and source passage in %s',
    (locale) => {
      const details: CallNoticeDetails = {
        ...read,
        matchChecks: {
          ...read.matchChecks!,
          residence: {
            value: 'Município de Santos',
            quote: 'Residir no município de Santos.',
            status: 'needsConfirmation',
          },
        },
      };
      const html = renderToStaticMarkup(
        <CallNoticeDetailsBody locale={locale} details={details} />,
      );
      expect(html).toContain('Residir no município de Santos.');
      expect(html).toContain(locale === 'pt-BR' ? 'Para você conferir' : 'For you to check');
      expect(html).toContain('lang="pt-BR"');
    },
  );
  test('a call whose documents were not read shows its official link alone', () => {
    const html = text(notRead);
    expect(html).toContain('href="https://cultura.example.gov.br/edital"');
    expect(html).not.toContain('files/edital.pdf');
    expect(html).not.toContain('Análise de elegibilidade');
    expect(html).toContain('não foram lidos');
  });

  test('lists what to send to apply and what only if selected, each with its passage', () => {
    const html = text(read);
    const toApply = html.lastIndexOf('Documentos para se inscrever');
    const afterSelection = html.indexOf('Documentos se for selecionado');
    expect(toApply).toBeGreaterThan(-1);
    expect(afterSelection).toBeGreaterThan(toApply);
    expect(html.indexOf('cópia do RG')).toBeLessThan(afterSelection);
    expect(html.indexOf('cópia do CPF')).toBeLessThan(afterSelection);
    expect(html.indexOf('certidão negativa')).toBeGreaterThan(afterSelection);
    expect(html).toContain('Você já tem');
    expect(html).toContain('Falta');
    expect(html).toContain('vence antes do fim das inscrições');
  });

  test('leaves out a passage that only repeats the document’s wording, keeps one that adds', () => {
    const html = text({
      ...read,
      matchChecks: {
        ...read.matchChecks!,
        requirements: [
          ...read.matchChecks!.requirements,
          {
            kind: 'other',
            detail: 'Formulário de inscrição (Anexo II)',
            stage: 'registration',
            quote: 'a) Formulário de inscrição (Anexo II);',
            status: 'needsConfirmation',
            paperValidity: null,
          },
        ],
      },
    });
    expect(html).toContain('Formulário de inscrição (Anexo II)');
    expect(html).not.toContain('a) Formulário de inscrição');
    expect(html).toContain('cópia do CPF');
  });

  test('lists a missing document before one the portfolio holds, whatever the call’s order', () => {
    const html = text(read);
    expect(html.indexOf('cópia do CPF')).toBeLessThan(html.indexOf('cópia do RG'));
  });

  test('sums up the documents to apply, leaving out those asked only after selection', () => {
    const html = text(read);
    expect(html).toContain('1 de 2 no seu portfólio');
    expect(html).toContain('Falta: 1');
    expect(html).toContain('Para você conferir: 0');
  });

  test('names each status once, over its group, instead of on every document', () => {
    const html = text(read);
    expect(html).toMatch(/<h4[^>]*><span[^>]*bg-status-missing[^>]*><\/span>Falta<span[^>]*>\(1\)/);
    expect(html).toMatch(
      /<h4[^>]*><span[^>]*bg-status-open[^>]*><\/span>Você já tem<span[^>]*>\(1\)/,
    );
    expect(html.match(/>Falta</g)).toHaveLength(1);
  });

  test('starts with every section folded, so the summary is what shows first', () => {
    const html = text(read);
    expect(html).not.toContain('aria-expanded="true"');
    for (const title of ['Sobre o edital', 'Quem pode participar', 'Vagas reservadas'])
      expect(html).toMatch(new RegExp(`aria-expanded="false"[^>]*>.*?${title}`));
  });

  test('shows the rules and the reserved places with their passages', () => {
    const html = text(read);
    expect(html).toContain('maiores de 18 anos');
    expect(html).toContain('reserva de 20% para mulheres');
  });

  test('puts the official page in the summary, above every drawer, read or not', () => {
    for (const details of [read, notRead]) {
      const html = text(details);
      const official = html.indexOf('href="https://cultura.example.gov.br/edital"');
      expect(official).toBeGreaterThan(-1);
      expect(official).toBeLessThan(html.indexOf('class="bt-drawer"'));
    }
  });

  test('keeps the annexes in a drawer of their own, counted', () => {
    expect(text(read)).toContain('Anexos do edital<span class="font-body font-normal"> (1)</span>');
  });

  test('names an annex by its label and the total budget as the call’s total', () => {
    const html = text(read);
    expect(html).toContain('Edital 02/2026 - Retificado');
    expect(html).toContain('Valor total do edital');
    expect(html).toMatch(/900\.000,00/);
  });
});
