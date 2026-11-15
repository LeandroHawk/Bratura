import type { Source } from '@bratura/shared/entities/source/entity';
import { ianaTimeZone } from '@bratura/shared/primitives/code/time/time-zone/fields';
import { describe, expect, test } from 'vitest';
import { callNumberOf, callsOfCallPages, callsOfDocumentsOnListing } from './discovery';

type OfficialPageSource = Extract<Source, { kind: 'officialPage' }>;

const now = Date.UTC(2026, 10, 15);
const sourceOf = (fields: Partial<OfficialPageSource>): OfficialPageSource => ({
  kind: 'officialPage',
  slug: 'test',
  name: 'Test',
  isActive: true,
  robotsCheckedOn: '2026-11-15',
  termsCheckedOn: '2026-11-15',
  listingUrl: 'https://www.ba.gov.br/fundacaocultural/editais-2026',
  discovery: {
    hops: 'callPage',
    callPageUrlParts: ['/fundacaocultural/edital', '/fundacaocultural/convocatoria'],
  },
  documentUrlParts: ['/sites/site-funceb/files/'],
  timeZone: ianaTimeZone.parse('America/Bahia'),
  ...fields,
});
const a = (href: string, text: string) => `<a href="${href}">${text}</a>`;
const files = '/fundacaocultural/sites/site-funceb/files';

describe('callsOfCallPages (Bahia, Paraná, Rio)', () => {
  const pages: Record<string, string> = {
    'https://www.ba.gov.br/fundacaocultural/editais-2026': [
      a('/fundacaocultural/convocatoria-sala-do-coro', 'EDITAL 027/2026 - SALA DO CORO'),
      a('/fundacaocultural/edital-0222026-apoio', 'EDITAL 022/2026 - APOIO A ESPETÁCULOS'),
      a('/fundacaocultural/edital-0042025-bolsas', 'EDITAL 004/2025 - BOLSAS'),
      a('/fundacaocultural/institucional', 'Institucional'),
      a('https://outro.gov.br/fundacaocultural/edital-x', 'EDITAL 030/2026 - OUTRO SITE'),
    ].join(''),
    'https://www.ba.gov.br/fundacaocultural/convocatoria-sala-do-coro': [
      a(`${files}/2026-11/CONVOCATORIA%20SALA%20DO%20CORO.pdf`, 'CONVOCATÓRIA SALA DO CORO.pdf'),
      a(`${files}/2026-11/ANEXO%20I.pdf`, 'ANEXO I - DETALHAMENTO DO OBJETO.pdf'),
      a('https://forms.cloud.microsoft/x', 'FORMULÁRIO DE INSCRIÇÃO'),
    ].join(''),
    'https://www.ba.gov.br/fundacaocultural/edital-0222026-apoio': [
      a(`${files}/2026-07/EDITAL.pdf`, 'EDITAL DE APOIO.pdf'),
      a(`${files}/2026-10/PORTARIA%20269.pdf`, 'PORTARIA 269_2026 - RESULTADO FINAL.pdf'),
    ].join(''),
  };
  const fetched: string[] = [];
  const fetchHtml = async (url: string) => {
    fetched.push(url);
    const html = pages[url];
    if (html === undefined) throw new Error(`not in the fixture: ${url}`);
    return html;
  };
  const source = sourceOf({});
  const run = () =>
    callsOfCallPages(
      source,
      ['/fundacaocultural/edital', '/fundacaocultural/convocatoria'],
      fetchHtml,
      async () => {},
      now,
    );

  test('keeps a call page with its documents, the page as its id and official link', async () => {
    expect(await run()).toEqual([
      {
        externalId: 'https://www.ba.gov.br/fundacaocultural/convocatoria-sala-do-coro',
        title: 'EDITAL 027/2026 - SALA DO CORO',
        officialUrl: 'https://www.ba.gov.br/fundacaocultural/convocatoria-sala-do-coro',
        documents: [
          {
            url: `https://www.ba.gov.br${files}/2026-11/CONVOCATORIA%20SALA%20DO%20CORO.pdf`,
            label: 'CONVOCATÓRIA SALA DO CORO.pdf',
          },
          {
            url: `https://www.ba.gov.br${files}/2026-11/ANEXO%20I.pdf`,
            label: 'ANEXO I - DETALHAMENTO DO OBJETO.pdf',
          },
        ],
      },
    ]);
  });

  test('skips a call that posts results, one numbered in a past year, and other hosts unfetched', async () => {
    fetched.length = 0;
    await run();
    expect(fetched).toEqual([
      'https://www.ba.gov.br/fundacaocultural/editais-2026',
      'https://www.ba.gov.br/fundacaocultural/convocatoria-sala-do-coro',
      'https://www.ba.gov.br/fundacaocultural/edital-0222026-apoio',
    ]);
  });

  test('a call page that fails is skipped, not the whole run', async () => {
    const failing = async (url: string) => {
      if (url.endsWith('apoio')) throw new Error('HTTP 500');
      return await fetchHtml(url);
    };
    const calls = await callsOfCallPages(
      source,
      ['/fundacaocultural/'],
      failing,
      async () => {},
      now,
    );
    expect(calls.map(({ title }) => title)).toEqual(['EDITAL 027/2026 - SALA DO CORO']);
  });
});

describe('callNumberOf', () => {
  test.each([
    ['Edital FEC 02/2026 - Rainha Conga - Retificado em 10/11/26', 'fec 2/2026'],
    ['Edital FEC 02/26 - Rainha Conga - Cronograma Alterado - 04/09/2026', 'fec 2/2026'],
    ['EDITAL DE SELEÇÃO PÚBLICA Nº 001/2026 – SECMA', 'selecao 1/2026'],
    ['EDITAL DE CHAMAMENTO PÚBLICO Nº 006.2024', 'chamamento 6/2024'],
    ['PREGÃO ELETRÔNICO 044-2025 - SECMA', 'pregao 44/2025'],
  ])('%s → %s', (label, number) => {
    expect(callNumberOf(label)).toBe(number);
  });

  test.each([
    'Anexo I - Categorias para bolsas',
    'Edital Retificado - Publicado em 31/07/25',
    'Resultado Preliminar - Publicado dia 13/05/2026',
  ])('names no call: %s', (label) => {
    expect(callNumberOf(label)).toBeNull();
  });
});

describe('callsOfDocumentsOnListing (Minas Gerais, Maranhão)', () => {
  const mg = '/download/category/15-fundo-estadual-de-cultura-fec';
  const source = sourceOf({
    listingUrl: 'https://www.secult.mg.gov.br/editais/fundo-estadual-de-cultura-fec/editais-fec',
    discovery: { hops: 'documentsOnListing' },
    documentUrlParts: ['?download='],
  });
  const html = [
    a(`${mg}?download=5062`, 'Edital FEC 06/2026 - Coreto - Retificado em 10/11/26'),
    a(`${mg}?download=5056`, 'Edital FEC 06/2026 - Coreto - Retificado em 06/11/26'),
    a(`${mg}?download=4830`, 'Edital FEC 06/2026 - Coreto'),
    a(`${mg}?download=4833`, 'Anexo I - Critérios de avaliação'),
    a(`${mg}?download=4900`, 'Edital FEC 01/2026 - Afromineiridades'),
    a(`${mg}?download=5055`, 'Resultado FEC e Edital atualizado - Edital 01'),
    a(`${mg}?download=3000`, 'Edital FEC 03/2025 - Antigo'),
    a(`${mg}?download=3100`, 'PREGÃO ELETRÔNICO 044/2026 - ELEVADORES'),
    a('/editais/editais-pnab', 'Editais PNAB'),
  ].join('');
  const url = (id: number) => `https://www.secult.mg.gov.br${mg}?download=${id}`;

  test('one call per number: its newest notice and its annexes, the listing as its link', () => {
    expect(callsOfDocumentsOnListing(source, html, now)).toEqual([
      {
        externalId: 'fec 6/2026',
        title: 'Edital FEC 06/2026 - Coreto - Retificado em 10/11/26',
        officialUrl: source.listingUrl,
        documents: [
          { url: url(5062), label: 'Edital FEC 06/2026 - Coreto - Retificado em 10/11/26' },
          { url: url(4833), label: 'Anexo I - Critérios de avaliação' },
        ],
      },
    ]);
  });
});
