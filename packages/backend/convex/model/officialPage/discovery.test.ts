import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  badescCultureSource,
  bahiaFuncebSource,
  tocantinsPnabPlatformSource,
  chamberOfDeputiesCultureSource,
  erechimPnabSource,
  estanciaCultureCallsSource,
  funarteCallsSource,
  maranhaoSecmaSource,
  jundiaiCultureSource,
  palmasFcpSource,
  paranaSeecSource,
  portoAlegreCultureSource,
  portoVelhoFunculturalSource,
  recifeCultureSource,
  rioBrancoCulturaSource,
  salvadorFgmSource,
  sesiSpCultureSource,
} from '../sources/registry';
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
        registrationCloses: null,
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

  test("a page inside another call page's folder is part of that call, not a call (Funesc)", async () => {
    const listing = 'https://funesc.pb.gov.br/editais';
    const call = `${listing}/edital-selecao-de-musicos-bolsistas-2026`;
    const inside = `${call}/audicoes-pecas-de-confronto`;
    const source = {
      ...chamberOfDeputiesCultureSource,
      listingUrl: listing,
      discovery: { hops: 'callPage' as const, callPageUrlParts: ['funesc.pb.gov.br/editais/'] },
    };
    siteAnswers({
      [listing]: a(call, 'Edital Seleção de músicos bolsistas 2026') + a(inside, 'Audições'),
      [call]: a(`${call}/edital-001_2026.pdf`, 'Edital 001/2026'),
      [inside]: a(`${call}/edital-001_2026.pdf`, 'Edital 001/2026'),
    });
    expect((await callsOf(source)).map(({ externalId }) => externalId)).toEqual([call]);
  });

  test('the PNAB platform: calls at root slugs beside its home, each file titled by its link (Tocantins)', async () => {
    const site = 'https://pnabtocantins.com.br';
    const base64 = (text: string) => btoa(String.fromCharCode(...new TextEncoder().encode(text)));
    const file = (id: number, title: string) =>
      `${site}/lerarquivo/${base64(`upload/edital_documento/25/edital-25-documento-${id}.pdf`)}/${base64(title)}`;
    const notice = file(371, 'EDITAL Nº 02/2026 - CULTURAS URBANAS E PERIFÉRICAS');
    const annex = file(372, 'ANEXO 1 - FORMULÁRIO DE INSCRIÇÃO');
    const categories = file(380, 'ANEXO 9 - CATEGORIAS E VAGAS');
    siteAnswers({
      [tocantinsPnabPlatformSource.listingUrl]: [
        a(`${site}/`, 'Início'),
        a(`${site}/faq`, 'FAQ'),
        a(`${site}/fomento-cultura-urbana`, 'Acessar'),
        a(`${site}/fomento-povo-indigena`, 'Acessar'),
      ].join(''),
      [`${site}/`]: a(`${site}/fomento-cultura-urbana`, 'Acessar'),
      [`${site}/faq`]: '<h1>Dúvidas</h1>',
      [`${site}/fomento-cultura-urbana`]:
        '<h1>EDITAL DE CHAMAMENTO PÚBLICO Nº 02/2026 - CULTURAS URBANAS E PERIFÉRICAS</h1>' +
        [
          a(notice, 'Baixar Edital em PDF'),
          a(notice, 'Baixar'),
          a(annex, 'Baixar'),
          a(categories, 'Baixar'),
        ].join(''),
      [`${site}/fomento-povo-indigena`]:
        '<h1>EDITAL Nº 05/2026 - POVOS INDÍGENAS</h1>' +
        [
          a(file(390, 'EDITAL Nº 05/2026 - POVOS INDÍGENAS'), 'Baixar'),
          a(file(408, 'RESULTADO FINAL ETAPA DE AVALIAÇÃO'), 'Baixar'),
        ].join(''),
    });
    expect(await callsOf(tocantinsPnabPlatformSource)).toEqual([
      {
        externalId: `${site}/fomento-cultura-urbana`,
        title: 'EDITAL DE CHAMAMENTO PÚBLICO Nº 02/2026 - CULTURAS URBANAS E PERIFÉRICAS',
        officialUrl: `${site}/fomento-cultura-urbana`,
        documents: [
          { url: notice, label: 'EDITAL Nº 02/2026 - CULTURAS URBANAS E PERIFÉRICAS' },
          { url: annex, label: 'ANEXO 1 - FORMULÁRIO DE INSCRIÇÃO' },
          { url: categories, label: 'ANEXO 9 - CATEGORIAS E VAGAS' },
        ],
        registrationCloses: null,
      },
    ]);
  });

  test("a call's notice the listing links through its /view page is the call's, not the frame (Câmara)", async () => {
    const listing = chamberOfDeputiesCultureSource.listingUrl;
    const page = `${listing}/edital-2026`;
    const notice = `${listing}/EditaldeSeleoCultural012026.pdf`;
    siteAnswers({
      [listing]: a(page, 'Abertura Edital 2026/2027') + a(`${notice}/view`, 'Edital 01/2026'),
      [page]: a(notice, 'Edital de Seleção Cultural 01/2026'),
    });
    const [call] = await callsOf(chamberOfDeputiesCultureSource);
    expect(call?.documents.map(({ url }) => url)).toEqual([notice]);
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

  test('a notice in two formats is kept once; a call page with no notice still is a call (Salvador, Paraná)', async () => {
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
      ['ANEXO-I-PLANO.pdf'],
    ]);
  });

  test('an "Acessar" link on a page with no <h1>: its numbered notice names the call (Estância)', async () => {
    const site = 'https://editalcultural.estancia.se.gov.br';
    const download = (id: number, name: string) =>
      `<p><strong>${name}</strong></p>${a(`/Arquivos/DownloadArquivos/?id=${id}`, 'Baixar')}`;
    siteAnswers({
      [estanciaCultureCallsSource.listingUrl]: [
        a('/Editais/Details/53', 'Acessar'),
        a('/Editais/Details/45', 'Acessar'),
        a('/Editais/Details/51', 'Acessar'),
      ].join(''),
      [`${site}/Editais/Details/53`]:
        '<h3>Publicação do Edital</h3>' + download(70, 'EDITAL 022/2026 – CULTURAS DA MINHA TERRA'),
      [`${site}/Editais/Details/45`]: download(55, 'Plano de Aplicação dos Recursos (PAR)'),
      [`${site}/Editais/Details/51`]: download(61, 'Resultado Final da Seleção do Edital 004-2026'),
    });
    const calls = await callsOf(estanciaCultureCallsSource);
    expect(calls.map(({ title, documents }) => [title, documents.map(({ url }) => url)])).toEqual([
      ['EDITAL 022/2026 – CULTURAS DA MINHA TERRA', [`${site}/Arquivos/DownloadArquivos/?id=70`]],
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

  test('where the page is the notice (Badesc): the page goes first, titled by its h1 or <title>; a page with no notice, or whose title names none, is no call; a linked notice keeps the page out', async () => {
    const site = 'https://fundacaoculturalbadesc.com';
    const post = `${site}/chamada-publica-2/chamada-publica-1a-exposicao-individual-espaco-paulo-gaiad/`;
    siteAnswers({
      [badescCultureSource.listingUrl]: [
        a(post, 'Chamada Pública 1ª Exposição Individual … Leia [+]'),
        a(
          `${site}/chamada-publica-2/confira-os-selecionados-da-chamada-publica/`,
          'Confira os selecionados',
        ),
        a(`${site}/chamada-publica-2/materiais-educativos`, 'MATERIAIS EDUCATIVOS'),
        a(`${site}/edital`, 'EDITAL'),
        a(`${site}/chamada-publica-2/chamada-musical/`, 'Chamada Musical'),
      ].join(''),
      [`${site}/chamada-publica-2/chamada-musical/`]: [
        '<h1>Chamada Pública Badesc Musical 2027</h1>',
        a(`${site}/wp-content/uploads/2026/11/Edital-Musical-2027.pdf`, 'Edital'),
      ].join(''),
      [post]:
        '<h1>Chamada Pública Espaço Paulo Gaiad 2027</h1><a href="https://forms.gle/x">inscrição</a>',
      [`${site}/chamada-publica-2/confira-os-selecionados-da-chamada-publica/`]: '<h1>Confira</h1>',
      [`${site}/chamada-publica-2/materiais-educativos`]: a(
        `${site}/wp-content/uploads/jogo.pdf`,
        'Jogo',
      ),
      [`${site}/edital`]: [
        '<title>EDITAL DE EXPOSIÇÕES FERNANDO BECK 2027 - Fundação Cultural Badesc</title>',
        a(`${site}/wp-content/uploads/2025/10/Inventario.pdf`, 'clique aqui'),
      ].join(''),
    });
    const calls = await callsOf(badescCultureSource);
    expect(calls.map(({ title, documents }) => [title, documents.map(({ url }) => url)])).toEqual([
      ['Chamada Pública Espaço Paulo Gaiad 2027', [post]],
      [
        'EDITAL DE EXPOSIÇÕES FERNANDO BECK 2027',
        [`${site}/edital`, `${site}/wp-content/uploads/2025/10/Inventario.pdf`],
      ],
      // A page that links its notice keeps the file, not itself.
      [
        'Chamada Pública Badesc Musical 2027',
        [`${site}/wp-content/uploads/2026/11/Edital-Musical-2027.pdf`],
      ],
    ]);
  });

  test('news as calls (Porto Alegre): a post over a year old is skipped, one with no date kept; a prize or open registration in the title names the call', async () => {
    const news = 'https://prefeitura.poa.br/smc/noticias';
    const published = (date: string) =>
      `<div class="field field--name-field-noticia-data-no-calendario field--item">${date}</div>`;
    siteAnswers({
      [portoAlegreCultureSource.listingUrl]: [
        a(`${news}/premio-musica-2026`, 'Leia Mais'),
        a(`${news}/teatros-2026`, 'Leia Mais'),
        a(`${news}/premio-literatura-30`, 'Leia Mais'),
        a(`${news}/sem-data`, 'Leia Mais'),
      ].join(''),
      [`${news}/premio-musica-2026`]: [
        '<title>Abertas as inscrições para o Prêmio Açorianos de Música 2026 | Prefeitura</title>',
        published('17/10/2026 04:42'),
        a('https://forms.gle/x', 'link'),
      ].join(''),
      [`${news}/teatros-2026`]: [
        '<title>Começam nesta segunda-feira as inscrições para ocupação dos teatros | Prefeitura</title>',
        published('05/01/2026 06:10'),
      ].join(''),
      [`${news}/premio-literatura-30`]: [
        '<title>Abertas inscrições para 30ª edição do Prêmio Açorianos de Literatura | Prefeitura</title>',
        published('11/12/2024 08:43'),
      ].join(''),
      [`${news}/sem-data`]: '<title>Prêmio Açorianos de Dança | Prefeitura</title>',
    });
    const calls = await callsOf(portoAlegreCultureSource);
    expect(calls.map(({ title, documents }) => [title, documents.map(({ url }) => url)])).toEqual([
      [
        'Abertas as inscrições para o Prêmio Açorianos de Música 2026',
        [`${news}/premio-musica-2026`],
      ],
      [
        'Começam nesta segunda-feira as inscrições para ocupação dos teatros',
        [`${news}/teatros-2026`],
      ],
      ['Prêmio Açorianos de Dança', [`${news}/sem-data`]],
    ]);
  });

  test("an http link to the source's own host is fetched as https, once; another host's is not (Sesi SP)", async () => {
    const page = 'www.sesisp.org.br/cultura/sesi-sp-abre-inscricoes-bachiana';
    const media = 'https://cronos-media.sesisenaisp.org.br/api/media/1-0/files?file=arq_66.pdf';
    const fetchMock = siteAnswers({
      [sesiSpCultureSource.listingUrl]: [
        a(`http://${page}`, 'Processo Seletivo Bachiana Jovem'),
        a(`https://${page}`, 'Processo Seletivo Bachiana Jovem'),
        a('http://outro.org.br/cultura/sesi-sp-x', 'Outro'),
      ].join(''),
      [`https://${page}`]: a(media, 'Confira o regulamento aqui'),
    });
    const calls = await callsOf(sesiSpCultureSource);
    expect(calls.map(({ externalId, documents }) => [externalId, documents])).toEqual([
      [`https://${page}`, [{ url: media, label: 'Confira o regulamento aqui' }]],
    ]);
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      sesiSpCultureSource.listingUrl,
      `https://${page}`,
    ]);
  });

  test('a frame document linked as http on the listing and on a call page is still the frame', async () => {
    const page = 'www.sesisp.org.br/cultura/sesi-sp-abre-inscricoes-bachiana';
    const frame = a('http://www.sesisp.org.br/cultura/edital-geral.pdf', 'Edital geral');
    const media = 'https://cronos-media.sesisenaisp.org.br/api/media/1-0/files?file=arq_66.pdf';
    siteAnswers({
      [sesiSpCultureSource.listingUrl]: frame + a(`http://${page}`, 'Bachiana Jovem'),
      [`https://${page}`]: frame + a(media, 'Confira o regulamento aqui'),
    });
    const frameAsDocument = {
      ...sesiSpCultureSource,
      documentUrlParts: [...sesiSpCultureSource.documentUrlParts, '/cultura/edital-geral'],
    };
    const [call] = await callsOf(frameAsDocument);
    expect(call?.documents.map(({ url }) => url)).toEqual([media]);
  });

  test('a JSON listing (Rio Branco): each item a call page by its id, titled by its field; a past edition not opened; the close the page prints', async () => {
    const site = 'https://cultura.riobranco.ac.gov.br';
    const listing = [
      { id: 43, titulo: ' Edital 10/2026 -  Pequenos Apoios - Música ', status_edital: '1' },
      { id: 42, titulo: 'Edital 09/2026 - Patrimônio Cultural' },
      { id: 6, titulo: 'Fundo Municipal de Cultura 2023 - Povos Originários' },
      { id: 7, titulo: null },
      { id: '', titulo: 'Id vazio' },
      { titulo: 'Sem id' },
    ];
    const html = (body: string) =>
      new Response(body, { headers: { 'content-type': 'text/html; charset=UTF-8' } });
    const answers: Record<string, () => Response> = {
      [rioBrancoCulturaSource.listingUrl]: () => Response.json(listing),
      [`${site}/site/edital-documento/43`]: () =>
        html(
          [
            '<p>Data de Início das Inscrições: 01/12/2026 Data de Término das Inscrições: 20/12/2026</p>',
            a(
              `${site}/site/edital-documento/download/800`,
              'Edital 10/2026 - Pequenos Apoios - Música',
            ),
            a(`${site}/site/edital-documento/download/801`, 'Anexo nº 05 - Planilha de Categorias'),
          ].join(''),
        ),
      [`${site}/site/edital-documento/42`]: () =>
        html(
          [
            a(`${site}/site/edital-documento/download/703`, 'Edital 09/2026 - Patrimônio Cultural'),
            a(`${site}/site/edital-documento/download/740`, 'RESULTADO FINAL - EDITAL 09/2026'),
          ].join(''),
        ),
    };
    const fetchMock = vi.fn<typeof fetch>(
      async (input) => answers[String(input)]?.() ?? new Response('', { status: 404 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    expect(await callsOf(rioBrancoCulturaSource)).toEqual([
      {
        externalId: `${site}/site/edital-documento/43`,
        title: 'Edital 10/2026 - Pequenos Apoios - Música',
        officialUrl: `${site}/site/edital-documento/43`,
        documents: [
          {
            url: `${site}/site/edital-documento/download/800`,
            label: 'Edital 10/2026 - Pequenos Apoios - Música',
          },
          {
            url: `${site}/site/edital-documento/download/801`,
            label: 'Anexo nº 05 - Planilha de Categorias',
          },
        ],
        registrationCloses: {
          at: Date.UTC(2026, 11, 21, 4, 59, 59),
          timeZone: rioBrancoCulturaSource.timeZone,
          precision: 'day',
        },
      },
    ]);
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([
      rioBrancoCulturaSource.listingUrl,
      `${site}/site/edital-documento/43`,
      `${site}/site/edital-documento/42`,
    ]);
  });

  test('folders that need a notice (Palmas): a folder of courses is no call; an icon link named by its aria-label is the notice', async () => {
    const site = 'https://www.palmas.to.gov.br';
    const page = `${site}/core/orgao/fundacao-cultural/`;
    const icon = (file: string, name: string) =>
      `<a class="orgao-arquivo-visualizar" href="/media/arquivo/pagina_arquivo/${file}" aria-label="Visualizar PDF ${name}"><i class="bi bi-eye"></i></a>`;
    siteAnswers({
      [palmasFcpSource.listingUrl]: [
        a('?arquivo_pasta=8ea2#arquivos-documentos', 'EDITAL Nº 05/2026/FCP - 10º SALÃO PALMENSE'),
        a('?arquivo_pasta=84b4#arquivos-documentos', 'Cursos de Iniciação Artística - 2026'),
      ].join(''),
      [`${page}?arquivo_pasta=8ea2`]: icon('edital_10_SALAO.pdf', 'Edital Nº 05/2026/FCP'),
      [`${page}?arquivo_pasta=84b4`]: icon('Grade_de_Cursos.pdf', 'Grade de Cursos 2026'),
    });

    expect(await callsOf(palmasFcpSource)).toEqual([
      {
        externalId: `${page}?arquivo_pasta=8ea2`,
        title: 'EDITAL Nº 05/2026/FCP - 10º SALÃO PALMENSE',
        officialUrl: `${page}?arquivo_pasta=8ea2`,
        documents: [
          {
            url: `${site}/media/arquivo/pagina_arquivo/edital_10_SALAO.pdf`,
            label: 'Visualizar PDF Edital Nº 05/2026/FCP',
          },
        ],
        registrationCloses: null,
      },
    ]);
  });

  /** Porto Velho's Funcultural: folders a Livewire button opens, served at `?folder=N`. */
  const portoVelhoSite = 'https://funcultural.portovelho.ro.gov.br';
  const folder = (id: number) => `${portoVelhoSite}/arquivos?folder=${id}`;
  const button = (id: number, name: string) =>
    `<button wire:click="selectFolder(${id})" class="flex"><svg><path d="M1"/></svg>` +
    `<div><span class="text-sm">${name}</span><span class="text-xs">Descrição da pasta</span></div></button>`;

  test('year folders (Porto Velho): this and last year opened, each call a folder titled by its button, files in it or a subfolder below, which stop at a result; a folder with no notice is no call', async () => {
    const file = (name: string) => a(`${portoVelhoSite}/uploads/arquivos/${name}.pdf`, name);
    const fetchMock = siteAnswers({
      [portoVelhoFunculturalSource.listingUrl]: [
        a(`${portoVelhoSite}/arquivos/lista/33997?editais`, 'Editais'),
        button(88673, '2026'),
        button(71932, '2025'),
        button(33999, '2019'),
        button(59545, 'EDITAIS e ANEXOS - LEI PAULO GUSTAVO'),
      ].join(''),
      [folder(88673)]: [
        button(99327, 'EDITAL DE CHAMAMENTO PÚBLICO N.º 004/2026/FUNCULTURAL'),
        button(90593, 'EDITAL DE CHAMAMENTO PÚBLICO - SIMPLIFICADO N.º 003/2026/FUNCULTURAL'),
      ].join(''),
      [folder(71932)]: button(79491, 'Termos de Inexigibilidade de Licitações'),
      [folder(99327)]: [
        button(99619, 'ERRATAS (RETIFICAÇÕES)'),
        file('EDITAL DE CHAMAMENTO PÚBLICO N.º 004-FUNCULTURAL-2026'),
        file('ANEXO VIII - CRONOGRAMA'),
      ].join(''),
      [folder(99619)]: file('PRIMEIRA ERRATA (RETIFICAÇÃO) PRAZOS'),
      [folder(90593)]: [
        button(91729, 'RESULTADOS'),
        button(90604, 'EDITAL DE CHAMAMENTO PÚBLICO SIMPLIFICADO N.º 003/2026'),
      ].join(''),
      [folder(91729)]: file('RESULTADO FINAL CONCURSO DE QUADRILHAS'),
      [folder(79491)]: file('TERMO DE INEXIGIBILIDADE DE LICITAÇÃO Nº 003-2025'),
    });

    expect(await callsOf(portoVelhoFunculturalSource)).toEqual([
      {
        externalId: folder(99327),
        title: 'EDITAL DE CHAMAMENTO PÚBLICO N.º 004/2026/FUNCULTURAL',
        officialUrl: folder(99327),
        documents: [
          {
            url: `${portoVelhoSite}/uploads/arquivos/EDITAL%20DE%20CHAMAMENTO%20P%C3%9ABLICO%20N.%C2%BA%20004-FUNCULTURAL-2026.pdf`,
            label: 'EDITAL DE CHAMAMENTO PÚBLICO N.º 004-FUNCULTURAL-2026',
          },
          {
            url: `${portoVelhoSite}/uploads/arquivos/ANEXO%20VIII%20-%20CRONOGRAMA.pdf`,
            label: 'ANEXO VIII - CRONOGRAMA',
          },
          {
            url: `${portoVelhoSite}/uploads/arquivos/PRIMEIRA%20ERRATA%20(RETIFICA%C3%87%C3%83O)%20PRAZOS.pdf`,
            label: 'PRIMEIRA ERRATA (RETIFICAÇÃO) PRAZOS',
          },
        ],
        registrationCloses: null,
      },
    ]);
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([
      portoVelhoFunculturalSource.listingUrl,
      folder(88673),
      folder(71932),
      folder(99327),
      folder(99619),
      folder(90593),
      folder(91729),
      folder(79491),
    ]);
  });

  test("year pages (Erechim): this and last year's pages opened for their call pages, older years and the menu not; a call with a result posted is dropped", async () => {
    const site = 'https://www.pmerechim.rs.gov.br/';
    const base = '<base href="https://www.pmerechim.rs.gov.br//">';
    const uploads = (name: string) => a(`uploads/paginas/${name}.pdf`, `${name}.pdf`);
    const callPage = (id: number) => `${site}/pagina/${id}/pnab---edital-n-0${id - 1840}2026`;
    const yearLinks = [
      a('pagina/1863/2025', '2025'),
      a('pagina/1729/2024', '2024'),
      a('pagina/1846/2026', '2026'),
    ];
    const fetchMock = siteAnswers({
      [erechimPnabSource.listingUrl]: [
        base,
        a('pagina/200/ouvidoria', 'Ouvidoria'),
        ...yearLinks,
      ].join(''),
      [`${site}/pagina/1863/2025`]: [base, ...yearLinks, uploads('Extrato do PAR')].join(''),
      [`${site}/pagina/1846/2026`]: [
        base,
        ...yearLinks,
        a('pagina/1848/pnab---edital-n-082026', 'PNAB - Edital nº 08/2026 - Cultura Viva'),
        a('pagina/1847/pnab---edital-n-072026', 'PNAB - Edital nº 07/2026 - Fomento'),
      ].join(''),
      [callPage(1848)]: [
        base,
        uploads('Edital Cultura Viva 08-2026'),
        uploads('Anexo 01 - Categorias'),
      ].join(''),
      [callPage(1847)]: [
        base,
        uploads('Edital de Chamamento Público nº 07-2026 - PNAB'),
        uploads('Ata da Etapa de Seleção - resultado final - Edital 07-2026'),
      ].join(''),
    });

    expect(await callsOf(erechimPnabSource)).toEqual([
      {
        externalId: callPage(1848),
        title: 'PNAB - Edital nº 08/2026 - Cultura Viva',
        officialUrl: callPage(1848),
        documents: [
          {
            url: `${site}/uploads/paginas/Edital%20Cultura%20Viva%2008-2026.pdf`,
            label: 'Edital Cultura Viva 08-2026.pdf',
          },
          {
            url: `${site}/uploads/paginas/Anexo%2001%20-%20Categorias.pdf`,
            label: 'Anexo 01 - Categorias.pdf',
          },
        ],
        registrationCloses: null,
      },
    ]);
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([
      erechimPnabSource.listingUrl,
      `${site}/pagina/1863/2025`,
      `${site}/pagina/1846/2026`,
      callPage(1848),
      callPage(1847),
    ]);
  });

  test('a call folder whose subfolders run past the 5 min is skipped, not recorded without them (Porto Velho)', async () => {
    const pagesOfSite: Record<string, string> = {
      [portoVelhoFunculturalSource.listingUrl]: button(88673, '2026'),
      [folder(88673)]: button(99327, 'EDITAL DE CHAMAMENTO PÚBLICO N.º 004/2026'),
      [folder(99327)]: [
        a(
          `${portoVelhoSite}/uploads/arquivos/EDITAL-004-2026.pdf`,
          'EDITAL DE CHAMAMENTO PÚBLICO N.º 004/2026',
        ),
        button(99619, 'ERRATAS'),
        button(99613, 'RESULTADOS'),
      ].join(''),
      [folder(99619)]: a(`${portoVelhoSite}/uploads/arquivos/ERRATA.pdf`, 'ERRATA'),
    };
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      if (String(input) === folder(99619)) await new Promise((done) => setTimeout(done, 400_000));
      return new Response(pagesOfSite[String(input)] ?? '', {
        headers: { 'content-type': 'text/html' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    expect(await callsOf(portoVelhoFunculturalSource)).toEqual([]);
    expect(fetchMock.mock.calls.map(([input]) => String(input))).not.toContain(folder(99613));
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
        registrationCloses: null,
      },
    ]);
  });

  test("a Plone file's /view page is read as the file it shows, each file once (Funesc)", () => {
    const funesc = {
      ...source,
      slug: 'pb-funesc-editais',
      listingUrl: 'https://funesc.pb.gov.br/editais/edital-panapana-2026',
      documentUrlParts: ['.pdf'],
    };
    const file = `${funesc.listingUrl}/edital-012_2026-panapana-2026.pdf`;
    const annex = `${funesc.listingUrl}/anexo-i-criterios.pdf`;
    const listing = [
      a(`${file}/view`, 'Edital 012/2026 - Panapaná 2026'),
      a(`${annex}/view`, 'Anexo I - Critérios de avaliação'),
      a(annex, 'Baixar'),
    ].join('');
    expect(
      callsOfDocumentsOnListing(funesc, { html: listing, url: funesc.listingUrl })[0]?.documents,
    ).toEqual([
      { url: file, label: 'Edital 012/2026 - Panapaná 2026' },
      { url: annex, label: 'Anexo I - Critérios de avaliação' },
    ]);
    const site = a('https://funesc.pb.gov.br/view', 'Edital 012/2026 - Panapaná 2026');
    expect(
      callsOfDocumentsOnListing(
        { ...funesc, documentUrlParts: ['funesc.pb.gov.br'] },
        { html: site, url: funesc.listingUrl },
      )[0]?.documents,
    ).toEqual([{ url: 'https://funesc.pb.gov.br/view', label: 'Edital 012/2026 - Panapaná 2026' }]);
  });
});

describe('callsOfDocumentsUnderHeadings', () => {
  const site = 'https://cultura.jundiai.sp.gov.br';
  const files = `${site}/wp-content/uploads/2026/11`;
  const html = [
    '<h1>Editais e Regulamentos</h1>',
    `<h1>BLOCOS DE CARNAVAL DE RUA 2027</h1><p>Período de inscrições: de 03 de novembro a 19 de novembro de 2026</p>`,
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

  test('one call per heading with a notice under it, the heading as its name and id, the close its text prints; no result posted, none older', () => {
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
        registrationCloses: {
          at: Date.UTC(2026, 10, 20, 2, 59, 59),
          timeZone: jundiaiCultureSource.timeZone,
          precision: 'day',
        },
      },
    ]);
  });
});

describe('callsOfDocumentsUnderHeadings: an accordion with years of past calls (Recife)', () => {
  const page = recifeCultureSource.listingUrl;
  const files = 'https://www.culturarecife.com.br/public/documentos';
  const item = (title: string, ...links: string[]) =>
    `<a class="accordion-toggle" href="#x"><b>${title}</b></a>${links.join('')}`;
  const html = [
    item('▸ RECIFE É DE CINEMA', a('./documentos/138/Edital_Recife_e_de_Cinema.pdf', 'EDITAL')),
    item('CICLO NATALINO 2026', a('./documentos/134/CONVOCATORIA.pdf', 'CONVOCATORIA')),
    item('CICLO NATALINO 2025', a('./documentos/23/CONVOCATORIA.pdf', 'CONVOCATORIA')),
    item(
      'MULTILINGUAGENS - LEI PAULO GUSTAVO',
      a('./documentos/67/EDITAL_LPG_2023.pdf', 'EDITAL MULTILINGUAGENS 2023'),
    ),
    item('CAPTADORES', a('./documentos/56/EDITAL-CAPTADORES-2025.pdf', 'Edital')),
    item('EDITAL Nº 08/2025 - PARECERISTAS', a('./documentos/57/Edital.pdf', 'Edital')),
    item('EDITAL Nº 03/2024 - BOLSAS', a('./documentos/58/Edital.pdf', 'Edital')),
  ].join('');

  test('drops a past edition, a numbered call before last year and a call whose notices name only years before last', () => {
    const calls = callsOfDocumentsUnderHeadings(recifeCultureSource, { html, url: page });
    expect(calls.map(({ title, documents }) => [title, documents.map(({ url }) => url)])).toEqual([
      ['RECIFE É DE CINEMA', [`${files}/138/Edital_Recife_e_de_Cinema.pdf`]],
      ['CICLO NATALINO 2026', [`${files}/134/CONVOCATORIA.pdf`]],
      ['CAPTADORES', [`${files}/56/EDITAL-CAPTADORES-2025.pdf`]],
      ['EDITAL Nº 08/2025 - PARECERISTAS', [`${files}/57/Edital.pdf`]],
    ]);
  });
});
