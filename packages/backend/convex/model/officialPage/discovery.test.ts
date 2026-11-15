import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  bahiaFuncebSource,
  funarteCallsSource,
  maranhaoSecmaSource,
  jundiaiCultureSource,
  paranaSeecSource,
  salvadorFgmSource,
} from '../../sources.fixture';
import {
  callNumberOf,
  callsOfCallPages,
  callsOfDocumentsOnListing,
  callsOfDocumentsUnderHeadings,
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

describe('callsOfCallPages', () => {
  const pages: Record<string, string> = {
    'https://www.ba.gov.br/fundacaocultural/editais-2026': [
      a('/fundacaocultural/convocatoria-sala-do-coro', 'EDITAL 027/2026 - SALA DO CORO'),
      a('/fundacaocultural/edital-0222026-apoio', 'EDITAL 022/2026 - APOIO A ESPETÁCULOS'),
      a('/fundacaocultural/edital-0042024-bolsas', 'EDITAL 004/2024 - BOLSAS'),
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
      a('/Pagina/Edital-Premiacao-Trajetorias', 'Edital Premiação de Trajetórias'),
    ].join(''),
    'https://www.cultura.pr.gov.br/Pagina/Edital-MOVCEU-Parana': [
      a(
        `${prFiles}/0.edital_movceu_parana_-_2026.docx_0.pdf`,
        'EDITAL MOVCEU PARANÁ - CHAMAMENTO PÚBLICO Nº 015/2026',
      ),
      a(`${prFiles}/0._edital_009_2024_movceu.pdf`, 'EDITAL Nº 009/2024 - EDIÇÃO ANTERIOR'),
    ].join(''),
    'https://www.cultura.pr.gov.br/Pagina/Edital-Bandas-e-Fanfarras': a(
      `${prFiles}/lpg-edital-012-2023.pdf`,
      'EDITAL INTERATIVO',
    ),
    'https://www.cultura.pr.gov.br/Pagina/Edital-Premiacao-Trajetorias': a(
      `${prFiles}/0._edital_premiacao_trajetorias.pdf`,
      'EDITAL Nº 008/2024 - PREMIAÇÃO DE TRAJETÓRIAS',
    ),
    'https://www.cultura.pr.gov.br/Pagina/Edital-de-Parcerias-MON': a(
      `${prFiles}/edital_-_001_-_2025.docx`,
      '(.DOC)',
    ),
  };
  /** Answers each page of `site` as HTML and anything else 404, like a site; returns the mock. */
  function siteAnswers(site = pages, failing: string[] = []) {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const html = site[String(input)];
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

  test('skips a call that posts results, one numbered before last year, and other hosts unfetched', async () => {
    const fetchMock = siteAnswers();
    await callsOf(bahiaFuncebSource);
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([
      'https://www.ba.gov.br/fundacaocultural/editais-2026',
      'https://www.ba.gov.br/fundacaocultural/convocatoria-sala-do-coro',
      'https://www.ba.gov.br/fundacaocultural/edital-0222026-apoio',
    ]);
  });

  test("follows Bahia's call pages outside `/edital…`: the training centre's, `funcebedital`, `selecao`", async () => {
    const ba = 'https://www.ba.gov.br/fundacaocultural';
    const notice = a(`${files}/2026-11/CONVOCATORIA.pdf`, 'CONVOCATÓRIA.pdf');
    siteAnswers({
      [bahiaFuncebSource.listingUrl]: [
        a(`${ba}/centro-de-formacao-em-artes-convocatoria-ferias-2027`, 'CFA FÉRIAS 2027'),
        a(`${ba}/funcebedital-no-012026-quarta-que-danca`, 'EDITAL 01/2026 QUARTA'),
        a(`${ba}/selecao-de-bolsista-vila-sul`, 'SELEÇÃO DE BOLSISTA VILA SUL'),
        a(`${ba}/fale-conosco`, 'Fale conosco'),
      ].join(''),
      [`${ba}/centro-de-formacao-em-artes-convocatoria-ferias-2027`]: notice,
      [`${ba}/funcebedital-no-012026-quarta-que-danca`]: notice,
      [`${ba}/selecao-de-bolsista-vila-sul`]: notice,
      [`${ba}/fale-conosco`]: notice,
    });
    const calls = await callsOf(bahiaFuncebSource);
    expect(calls.map(({ title }) => title)).toEqual([
      'CFA FÉRIAS 2027',
      'EDITAL 01/2026 QUARTA',
      'SELEÇÃO DE BOLSISTA VILA SUL',
    ]);
  });

  test('drops a document the listing links too: the site frame, not the call (Funarte)', async () => {
    const frame = a('/funarte/frame/edital-no-409-2025.pdf/view', 'Edital No. 409/2025, Cofin');
    const chamadas = 'https://www.gov.br/funarte/pt-br/fomento/chamadas-2026';
    siteAnswers({
      [chamadas]: frame + a(`${chamadas}/marc-ferrez`, 'XVIII Seleção Marc Ferrez'),
      [`${chamadas}/marc-ferrez`]:
        frame + a(`${chamadas}/marc-ferrez/Edital_MarcFerrez_final.pdf`, 'ACESSE AQUI'),
    });
    const [call] = await callsOf(funarteCallsSource);
    expect(call?.documents.map(({ url }) => url)).toEqual([
      `${chamadas}/marc-ferrez/Edital_MarcFerrez_final.pdf`,
    ]);
  });

  test('a "Clique aqui!" link names no call: the call page\'s own heading does (Salvador)', async () => {
    const site = 'https://fgm.salvador.ba.gov.br';
    const uploads = `${site}/wp-content/uploads/2026/10`;
    siteAnswers({
      [salvadorFgmSource.listingUrl]: [
        a(`${site}/edital-atelie-itinerante/`, 'Clique aqui!'),
        a(`${site}/edital-sem-titulo/`, 'Clique aqui!'),
      ].join(''),
      [`${site}/edital-atelie-itinerante/`]: [
        '<h1 class="entry-title">Edital Ateliê Itinerante de Restauro abre inscrições</h1>',
        a(`${uploads}/EDITAL-N-092026-ATELIE.pdf`, 'Edital'),
        a(`${uploads}/ANEXO-XII-MODELO-DE-INTERPOSICAO-DE-RECURSO-QUANTO-AO-RESULTADO.docx`, 'XII'),
      ].join(''),
      [`${site}/edital-sem-titulo/`]: a(`${uploads}/EDITAL.pdf`, 'Edital'),
    });
    const calls = await callsOf(salvadorFgmSource);
    expect(calls.map(({ title, documents }) => [title, documents.length])).toEqual([
      ['Edital Ateliê Itinerante de Restauro abre inscrições', 2],
    ]);
  });

  test('a notice in two formats is kept once; a page with no notice is no call (Salvador, Paraná)', async () => {
    const ba = 'https://www.ba.gov.br/fundacaocultural';
    siteAnswers({
      [bahiaFuncebSource.listingUrl]: [
        a(`${ba}/edital-0092026-atelie`, 'EDITAL 09/2026 - ATELIÊ'),
        a(`${ba}/edital-gestao-mon`, 'EDITAL DE GESTÃO MON'),
      ].join(''),
      [`${ba}/edital-0092026-atelie`]: [
        a(`${files}/2026-10/EDITAL-N-092026-ATELIE.pdf`, 'Edital'),
        a(`${files}/2026-10/FGM-EDITAL-09-2026-ATELIE.docx`, 'Edital'),
        a(`${files}/2026-10/ANEXO-I-CRONOGRAMA.docx`, 'Anexo I'),
      ].join(''),
      [`${ba}/edital-gestao-mon`]: a(`${files}/2026-10/ANEXO-I-PLANO.pdf`, 'Anexo I'),
    });
    const calls = await callsOf(bahiaFuncebSource);
    expect(calls.map(({ documents }) => documents.map(({ url }) => url.split('/').pop()))).toEqual([
      ['EDITAL-N-092026-ATELIE.pdf', 'ANEXO-I-CRONOGRAMA.docx'],
    ]);
  });

  test('skips a page whose notices are all numbered before last year by text or file name', async () => {
    siteAnswers();
    const calls = await callsOf(paranaSeecSource);
    expect(calls.map(({ title }) => title)).toEqual([
      'Edital MOVCEU Paraná',
      'Edital de Parcerias com Organizações Sociais – MON',
    ]);
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

  test("after a redirect, a page's relative links resolve against where it landed", async () => {
    const moved = 'https://www.ba.gov.br/fundacaocultural/convocatoria-sala-do-coro';
    const landed = 'https://www.ba.gov.br/fundacaocultural/2026/sala-do-coro/';
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input) => {
        const html =
          String(input) === landed
            ? a('../../sites/site-funceb/files/2026-11/EDITAL%20027.pdf', 'EDITAL 027/2026.pdf')
            : pages[String(input)];
        if (String(input) === moved) {
          return new Response(null, { status: 301, headers: { location: landed } });
        }
        return new Response(html ?? '', { headers: { 'content-type': 'text/html' } });
      }),
    );
    const [call] = await callsOf(bahiaFuncebSource);
    expect(call?.externalId).toBe(moved);
    expect(call?.documents.map(({ url }) => url)).toEqual([
      `https://www.ba.gov.br${files}/2026-11/EDITAL%20027.pdf`,
    ]);
  });

  test('a listing that redirects is not read again as one of its own call pages', async () => {
    const landed = 'https://www.ba.gov.br/fundacaocultural/editais-2026/';
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      if (String(input) === bahiaFuncebSource.listingUrl) {
        return new Response(null, { status: 301, headers: { location: landed } });
      }
      const html =
        String(input) === landed
          ? a(landed, 'EDITAIS 2026') + pages[bahiaFuncebSource.listingUrl]
          : pages[String(input)];
      return new Response(html ?? '', { headers: { 'content-type': 'text/html' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const everyPage = {
      ...bahiaFuncebSource,
      discovery: { hops: 'callPage' as const, callPageUrlParts: ['/fundacaocultural/'] },
    };
    await callsOf(everyPage);
    const fetched = fetchMock.mock.calls.map(([input]) => String(input));
    expect(fetched.filter((url) => url === landed)).toHaveLength(1);
  });

  test('a call page that fails is skipped, not the whole run', async () => {
    siteAnswers(pages, ['https://www.ba.gov.br/fundacaocultural/edital-0222026-apoio']);
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

  // Real 2026 notices (Mapas): a chain of numbers is no call 06 of 2011, nor 005 of 2020.
  test.each([
    'i-edital-de-chamamento-publico-n-c2-ba-06-11-008-2026-an.pdf',
    'edital-005-20-2026-socorro-andrade.pdf',
    'edital-retificado-10-11-2025.pdf',
  ])('a chain of numbers or a date names no call: %s', (name) => {
    expect(callNumberOf(fileNameAsLabel(at(name)))).toBeNull();
  });
});

describe('callsOfDocumentsOnListing', () => {
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
    a(`${mg}?download=3000`, 'Edital FEC 03/2024 - Antigo'),
    a(`${mg}?download=3100`, 'PREGÃO ELETRÔNICO 044/2026 - ELEVADORES'),
    a('/editais/editais-pnab', 'Editais PNAB'),
  ].join('');
  const url = (id: number) => `https://www.secult.mg.gov.br${mg}?download=${id}`;

  test('one call per number: its newest notice and its annexes, the listing as its link', () => {
    expect(callsOfDocumentsOnListing(source, { html, url: source.listingUrl })).toEqual([
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

describe('callsOfDocumentsUnderHeadings', () => {
  const site = 'https://cultura.jundiai.sp.gov.br';
  const files = `${site}/wp-content/uploads/2026/11`;
  const html = [
    '<h1>Editais e Regulamentos</h1>',
    `<h1>BLOCOS DE CARNAVAL DE RUA 2027</h1><p>Período de inscrições: 03/11 a 19/11</p>`,
    a(`${files}/Publicacao_edital-Blocos.pdf`, 'Imprensa'),
    a(`${files}/Edital_Blocos-de-Carnaval_2027.pdf`, 'PDF'),
    a(`${files}/ANEXO-I_-EDITAL-No-25_2026_Blocos.pdf`, 'Anexo I'),
    '<h1>PROESC 2026</h1>',
    a(`${files}/EDITAL-No-24_2026-PROESC.pdf`, 'EDITAL'),
    a(`${files}/Publicacao_PROESC-2026_Inscritos.pdf`, 'Resultado Preliminar da Admissibilidade'),
    '<h1>FESTA LITERÁRIA</h1>',
    a(`${files}/Anexo-I-Autodeclaracao.pdf`, 'Anexo I'),
    '<h2>ENCERRADOS</h2><h1>Edital 02/2023 - Bandas</h1>',
    a(`${files}/Edital-02-2023.pdf`, 'Edital'),
  ].join('');

  test('one call per heading with a notice under it, the heading as its name and id; no result posted, none older', () => {
    const calls = callsOfDocumentsUnderHeadings(jundiaiCultureSource, {
      html,
      url: jundiaiCultureSource.listingUrl,
    });
    expect(calls).toEqual([
      {
        externalId: 'BLOCOS DE CARNAVAL DE RUA 2027',
        title: 'BLOCOS DE CARNAVAL DE RUA 2027',
        officialUrl: jundiaiCultureSource.listingUrl,
        documents: [
          { url: `${files}/Publicacao_edital-Blocos.pdf`, label: 'Imprensa' },
          { url: `${files}/Edital_Blocos-de-Carnaval_2027.pdf`, label: 'PDF' },
          { url: `${files}/ANEXO-I_-EDITAL-No-25_2026_Blocos.pdf`, label: 'Anexo I' },
        ],
      },
    ]);
  });
});
