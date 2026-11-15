import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { bahiaFuncebSource, maranhaoSecmaSource, paranaSeecSource } from '../../sources.fixture';
import {
  callNumberOf,
  callsOfCallPages,
  callsOfDocumentsOnListing,
  fileNameAsLabel,
} from './discovery';

beforeEach(() => {
  vi.useFakeTimers({ now: Date.UTC(2026, 10, 15) });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const a = (href: string, text: string) => `<a href="${href}">${text}</a>`;
const files = '/fundacaocultural/sites/site-funceb/files';
const prFiles = '/sites/default/arquivos_restritos/files/documento/2026-11';

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
    'https://www.cultura.pr.gov.br/': [
      a('/Pagina/Edital-MOVCEU-Parana', 'Edital MOVCEU Paraná'),
      a('/Pagina/Edital-Bandas-e-Fanfarras', 'Edital Bandas e Fanfarras'),
      a('/Pagina/Edital-de-Parcerias-MON', 'Edital de Parcerias com Organizações Sociais – MON'),
    ].join(''),
    'https://www.cultura.pr.gov.br/Pagina/Edital-MOVCEU-Parana': a(
      `${prFiles}/0.edital_movceu_parana_-_2026.docx_0.pdf`,
      'EDITAL MOVCEU PARANÁ - CHAMAMENTO PÚBLICO Nº 015/2026',
    ),
    'https://www.cultura.pr.gov.br/Pagina/Edital-Bandas-e-Fanfarras': a(
      `${prFiles}/lpg-edital-012-2023.pdf`,
      'EDITAL INTERATIVO',
    ),
    'https://www.cultura.pr.gov.br/Pagina/Edital-de-Parcerias-MON': a(
      `${prFiles}/edital_-_001_-_2025.docx`,
      '(.DOC)',
    ),
  };
  /** Answers each fixture page as HTML and anything else 404, like a site; returns the mock. */
  function siteAnswers(failing: string[] = []) {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const html = pages[String(input)];
      if (html === undefined || failing.includes(String(input)))
        return new Response('', { status: 404 });
      return new Response(html, { headers: { 'content-type': 'text/html; charset=UTF-8' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  /** Runs the reader with the 1 s spacing between call pages played out by the fake clock. */
  async function callsOf(source: Parameters<typeof callsOfCallPages>[0]) {
    const calls = callsOfCallPages(source);
    await vi.runAllTimersAsync();
    return await calls;
  }

  test('keeps a call page with its documents, the page as its id and official link', async () => {
    siteAnswers();
    expect(await callsOf(bahiaFuncebSource)).toEqual([
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
    const fetchMock = siteAnswers();
    await callsOf(bahiaFuncebSource);
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([
      'https://www.ba.gov.br/fundacaocultural/editais-2026',
      'https://www.ba.gov.br/fundacaocultural/convocatoria-sala-do-coro',
      'https://www.ba.gov.br/fundacaocultural/edital-0222026-apoio',
    ]);
  });

  test('skips a page whose notice names a past year in its text or file name', async () => {
    siteAnswers();
    const calls = await callsOf(paranaSeecSource);
    expect(calls.map(({ title }) => title)).toEqual(['Edital MOVCEU Paraná']);
  });

  test('stops opening call pages after 5 min, keeping the calls found', async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const html = pages[String(input)] ?? '';
      if (String(input) !== bahiaFuncebSource.listingUrl) {
        await new Promise((done) => setTimeout(done, 200_000));
      }
      return new Response(html, { headers: { 'content-type': 'text/html' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const everyPage = {
      ...bahiaFuncebSource,
      discovery: { hops: 'callPage' as const, callPageUrlParts: ['/fundacaocultural/'] },
    };
    const calls = await callsOf(everyPage);
    expect(fetchMock).toHaveBeenCalledTimes(3); // the listing and 2 of its 3 call pages
    expect(calls.map(({ title }) => title)).toEqual(['EDITAL 027/2026 - SALA DO CORO']);
  });

  test('a call page that fails is skipped, not the whole run', async () => {
    siteAnswers(['https://www.ba.gov.br/fundacaocultural/edital-0222026-apoio']);
    const everyPage = {
      ...bahiaFuncebSource,
      discovery: { hops: 'callPage' as const, callPageUrlParts: ['/fundacaocultural/'] },
    };
    const calls = await callsOf(everyPage);
    expect(calls.map(({ title }) => title)).toEqual(['EDITAL 027/2026 - SALA DO CORO']);
  });
});

describe('callNumberOf', () => {
  test.each([
    [
      'Edital FEC 02/2026 - Rainha Conga - Retificado em 10/11/26',
      { kind: 'fec', number: 2, year: 2026 },
    ],
    [
      'Edital FEC 02/26 - Rainha Conga - Cronograma Alterado - 04/09/2026',
      { kind: 'fec', number: 2, year: 2026 },
    ],
    ['EDITAL DE SELEÇÃO PÚBLICA Nº 001/2026 – SECMA', { kind: 'selecao', number: 1, year: 2026 }],
    ['EDITAL DE CHAMAMENTO PÚBLICO Nº 006.2024', { kind: 'chamamento', number: 6, year: 2024 }],
    ['PREGÃO ELETRÔNICO 044-2025 - SECMA', { kind: 'pregao', number: 44, year: 2025 }],
  ])('%s → %o', (label, number) => {
    expect(callNumberOf(label)).toEqual(number);
  });

  test.each([
    'Anexo I - Categorias para bolsas',
    'Edital Retificado - Publicado em 31/07/25',
    'Resultado Preliminar - Publicado dia 13/05/2026',
  ])('names no call: %s', (label) => {
    expect(callNumberOf(label)).toBeNull();
  });
});

describe('fileNameAsLabel', () => {
  const at = (name: string) => `https://www.cultura.pr.gov.br/files/${name}`;

  test.each([
    ['lpg-edital-012-2023.pdf', { kind: 'edital', number: 12, year: 2023 }],
    ['edital_-_001_-_2025.docx', { kind: 'edital', number: 1, year: 2025 }],
    ['0._edital_012_2026_pontos_de_cultura.pdf', { kind: 'edital', number: 12, year: 2026 }],
  ])('%s → %o', (name, number) => {
    expect(callNumberOf(fileNameAsLabel(at(name)))).toEqual(number);
  });

  // Mapas notices of 2026 in the dev DB (2026-11-15): read as "06/11" and "005/20" before.
  test.each([
    'i-edital-de-chamamento-publico-n-c2-ba-06-11-008-2026-an.pdf',
    'edital-005-20-2026-socorro-andrade.pdf',
    'edital-retificado-10-11-2025.pdf',
  ])('a chain of numbers or a date names no call: %s', (name) => {
    expect(callNumberOf(fileNameAsLabel(at(name)))).toBeNull();
  });
});

describe('callsOfDocumentsOnListing (Minas Gerais, Maranhão)', () => {
  const mg = '/download/category/15-fundo-estadual-de-cultura-fec';
  const source = {
    ...maranhaoSecmaSource,
    slug: 'mg-secult-fec',
    name: 'Secult-MG — editais FEC',
    listingUrl: 'https://www.secult.mg.gov.br/editais/fundo-estadual-de-cultura-fec/editais-fec',
    documentUrlParts: ['?download='],
  };
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
    expect(callsOfDocumentsOnListing(source, html)).toEqual([
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
