import { describe, expect, test } from 'vitest';
import { headingOfHtml, linksOfHtml, sectionsOfHtml, textOfClass, titleOfHtml } from './html';

describe('linksOfHtml', () => {
  const page = 'https://www.ba.gov.br/fundacaocultural/editais-2026';

  test('a link inside a heading is still read', () => {
    const html = '<h2><a href="/edital-03">Edital 03/2026</a></h2><a href="/e.pdf">PDF</a>';
    expect(linksOfHtml(html, page).map(({ url }) => url)).toEqual([
      'https://www.ba.gov.br/edital-03',
      'https://www.ba.gov.br/e.pdf',
    ]);
  });

  test('resolves relative links, decodes the text and keeps page order', () => {
    const html = `
      <a href="/fundacaocultural/edital-0222026-apoio">EDITAL 022/2026 &ndash; <b>APOIO</b>&nbsp;A ESPETÁCULOS</a>
      <a class="x" href='https://www.ba.gov.br/fundacaocultural/sites/site-funceb/files/2026-07/EDITAL%20022.pdf'>EDITAL.pdf</a>`;
    expect(linksOfHtml(html, page)).toEqual([
      {
        url: 'https://www.ba.gov.br/fundacaocultural/edital-0222026-apoio',
        label: 'EDITAL 022/2026 – APOIO A ESPETÁCULOS',
      },
      {
        url: 'https://www.ba.gov.br/fundacaocultural/sites/site-funceb/files/2026-07/EDITAL%20022.pdf',
        label: 'EDITAL.pdf',
      },
    ]);
  });

  test("resolves relative links against the page's <base href> (Erechim), an in-page anchor against the page (Funarte)", () => {
    const html = `<base href="https://www.pmerechim.rs.gov.br//">
      <a href="#conteudo">Ir para o Conteúdo</a>
      <a href="pagina/1848/pnab---edital-n-022026">PNAB - Edital nº 02/2026</a>`;
    expect(linksOfHtml(html, 'https://www.pmerechim.rs.gov.br/pagina/1846/2026')).toEqual([
      { url: 'https://www.pmerechim.rs.gov.br/pagina/1846/2026', label: 'Ir para o Conteúdo' },
      {
        url: 'https://www.pmerechim.rs.gov.br//pagina/1848/pnab---edital-n-022026',
        label: 'PNAB - Edital nº 02/2026',
      },
    ]);
  });

  test("reads the links a Volto page keeps only in its state: listing items by getURL or an absolute @id, text-block links; a relative @id is not a page's URL", () => {
    const state = {
      content: {
        data: {
          items: [
            {
              '@id': 'https://www.gov.br/museudoindio/pt-br/editais/credenciamento',
              title: 'Credenciamento',
            },
          ],
          blocks: {
            b1: {
              '@type': 'slate',
              value: [
                {
                  type: 'h2',
                  children: [
                    { text: '' },
                    {
                      type: 'link',
                      data: {
                        url: 'https://www.gov.br/iphan/pt-br/x/edital.pdf/@@display-file/file',
                      },
                      children: [{ text: 'Edital ' }],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
      querystringsearch: {
        subrequests: {
          block1: {
            items: [
              {
                '@id': '/pt-br/abertos/premio',
                getURL: 'https://www.gov.br/iphan/pt-br/abertos/premio',
                title: 'Prêmio 2026',
              },
              { '@id': '/pt-br/abertos/sem-url', title: 'Sem URL absoluta' },
            ],
          },
        },
      },
    };
    const html = `<a href="/iphan/pt-br/assuntos">Assuntos</a><p>Carregando</p>
      <script>window.__data=${JSON.stringify(state).replace('"items":[', '"loading":undefined,"items":[')};</script>`;
    expect(linksOfHtml(html, 'https://www.gov.br/iphan/pt-br/abertos')).toEqual([
      { url: 'https://www.gov.br/iphan/pt-br/assuntos', label: 'Assuntos' },
      {
        url: 'https://www.gov.br/museudoindio/pt-br/editais/credenciamento',
        label: 'Credenciamento',
      },
      { url: 'https://www.gov.br/iphan/pt-br/abertos/premio', label: 'Prêmio 2026' },
      { url: 'https://www.gov.br/iphan/pt-br/x/edital.pdf/@@display-file/file', label: 'Edital' },
    ]);
  });

  test('a page whose state is not JSON keeps its HTML links', () => {
    const html = '<a href="/a">A</a><script>window.__data={broken;</script>';
    expect(linksOfHtml(html, page)).toEqual([{ url: 'https://www.ba.gov.br/a', label: 'A' }]);
  });

  test('drops other schemes, fragments, scripts and comments; one entry per URL', () => {
    const html = `
      <a href="mailto:x@ba.gov.br">mail</a><a href="javascript:void(0)">js</a>
      <script>document.write('<a href="/hidden">x</a>')</script><!-- <a href="/old">old</a> -->
      <a href="/edital#top"></a><a href="/edital">Edital 01/2026</a>`;
    expect(linksOfHtml(html, page)).toEqual([
      { url: 'https://www.ba.gov.br/edital', label: 'Edital 01/2026' },
    ]);
  });

  test('decodes numeric and named entities, accented letters included', () => {
    const html = '<a href="/download?a=1&amp;b=2">Sele&#231;&#xE3;o P&Uacute;BLICA N&ordm; 03</a>';
    expect(linksOfHtml(html, page)).toEqual([
      { url: 'https://www.ba.gov.br/download?a=1&b=2', label: 'Seleção PÚBLICA Nº 03' },
    ]);
  });

  test("an icon link is named by its aria-label (Palmas), never by its title tooltip (Salvador's share icon)", () => {
    const html = [
      '<a class="orgao-arquivo-visualizar" href="/e.pdf" title="Visualizar PDF Edital 05/2026"',
      ' aria-label="Visualizar PDF Edital  05/2026"><i class="bi bi-eye"></i></a>',
      '<a class="link-compartilhar" title="Copiar link!" href="/edital-x/"><i></i></a>',
      '<a href="/edital-x/">Edital X</a>',
    ].join('');
    expect(linksOfHtml(html, page)).toEqual([
      { url: 'https://www.ba.gov.br/e.pdf', label: 'Visualizar PDF Edital 05/2026' },
      { url: 'https://www.ba.gov.br/edital-x/', label: 'Edital X' },
    ]);
  });
});

describe('linksOfHtml: a link that names only an action (Estância)', () => {
  const page = 'https://editalcultural.estancia.se.gov.br/Editais/Details/52';
  const file = (id: number, name: string) =>
    `<div><p><strong>${name}</strong></p><p>Descrição: anexos</p>` +
    `<a href="/Arquivos/ViewArquivos/?id=${id}"><i class="fas fa-eye"></i> Visualizar</a>` +
    `<a href="/Arquivos/DownloadArquivos/?id=${id}" download><i></i> Baixar</a></div>`;

  test('takes the first text above it, or the action link just before it', () => {
    const html =
      file(62, 'EDITAL 005/2026 &#x2013; CULTURAS') +
      file(69, 'RESULTADO FINAL DO EDITAL 005/2026');
    expect(linksOfHtml(html, page).map(({ label }) => label)).toEqual([
      'EDITAL 005/2026 – CULTURAS',
      'EDITAL 005/2026 – CULTURAS',
      'RESULTADO FINAL DO EDITAL 005/2026',
      'RESULTADO FINAL DO EDITAL 005/2026',
    ]);
  });

  test('a heading in between is not borrowed, and a link that names something keeps its text', () => {
    const html =
      '<p>Edital 01/2026</p><h3>Documentos</h3><a href="/a">Baixar</a><a href="/b">Edital</a>';
    expect(linksOfHtml(html, page).map(({ label }) => label)).toEqual(['Baixar', 'Edital']);
  });
});

describe('titleOfHtml', () => {
  test("the page's <title> without the site's name after its last separator", () => {
    expect(titleOfHtml('<title>EDITAL DE EXPOSIÇÕES 2027 - Fundação Cultural Badesc</title>')).toBe(
      'EDITAL DE EXPOSIÇÕES 2027',
    );
    expect(titleOfHtml('<title>Chamada 01/2026 | Sesc</title>')).toBe('Chamada 01/2026');
    expect(titleOfHtml('<p>no title</p>')).toBe('');
  });
});

describe('textOfClass', () => {
  test('the first element holding the class as a whole word, its tags stripped; empty with none', () => {
    const html = [
      '<div class="field--name-field-noticia-data-no-calendario-x">01/01/2020</div>',
      '<div class="field field--name-field-noticia-data-no-calendario"><span>17/10/2026</span> 04:42</div>',
      '<div class="field--name-field-noticia-data-no-calendario">05/01/2026</div>',
    ].join('');
    expect(textOfClass(html, 'field--name-field-noticia-data-no-calendario')).toBe(
      '17/10/2026 04:42',
    );
    expect(textOfClass('<p>none</p>', 'field--name-field-noticia-data-no-calendario')).toBe('');
  });
});

describe('headingOfHtml', () => {
  test("the first heading's text, empty when the page has none (Salvador)", () => {
    const page = '<title>X – FGM</title><h1 class="t">Edital <b>09</b></h1><h1>FALE CONOSCO</h1>';
    expect(headingOfHtml(page)).toBe('Edital 09');
    expect(headingOfHtml('<title>Edital 09 – FGM</title><p>sem título</p>')).toBe('');
  });
});

describe('sectionsOfHtml', () => {
  test('each link goes under the heading above it, once, with the text between; what is above every heading goes nowhere', () => {
    const page = 'https://cultura.jundiai.sp.gov.br/editais-e-regulamentos/';
    const html = [
      '<a href="/decreto.pdf">Decreto</a><h1>Editais</h1>',
      '<h1>BLOCOS DE CARNAVAL</h1><p>Período</p><a href="/b.pdf">PDF</a><a href="/b.pdf">Edital</a>',
      '<h2>ENCERRADOS</h2><h1>CORTE <em>AFRO</em></h1><a href="/c.pdf">Edital</a>',
    ].join('');
    expect(sectionsOfHtml(html, page)).toEqual([
      { heading: 'Editais', links: [], text: '' },
      {
        heading: 'BLOCOS DE CARNAVAL',
        links: [{ url: 'https://cultura.jundiai.sp.gov.br/b.pdf', label: 'PDF' }],
        text: 'Período PDF Edital',
      },
      { heading: 'ENCERRADOS', links: [], text: '' },
      {
        heading: 'CORTE AFRO',
        links: [{ url: 'https://cultura.jundiai.sp.gov.br/c.pdf', label: 'Edital' }],
        text: 'Edital',
      },
    ]);
  });

  test("an element of the heading class titles a section too: Recife's in-page link, Spcine's button", () => {
    const page = 'https://www.culturarecife.com.br/public/home.php';
    const html = [
      '<h5>2026</h5>',
      '<a class="accordion-toggle" data-toggle="collapse" href="#edital_home_138"><b>RECIFE É DE CINEMA</b></a>',
      '<a href="./documentos/edital_home_138/Edital.pdf">EDITAL</a>',
      '<button class="x-acc-header" type="button"><span>▸</span><span>01/2026 | Games</span></button>',
      '<a href="./documentos/games.pdf">EDITAL</a>',
      '<a class="accordion-toggle-icon" href="#x">não é título</a>',
    ].join('');
    expect(sectionsOfHtml(html, page, 'accordion-toggle').map(({ heading }) => heading)).toEqual([
      '2026',
      'RECIFE É DE CINEMA',
    ]);
    expect(
      sectionsOfHtml(html, page, 'x-acc-header').map(({ heading, links }) => ({ heading, links })),
    ).toEqual([
      {
        heading: '2026',
        links: [
          { url: page, label: 'RECIFE É DE CINEMA' },
          {
            url: 'https://www.culturarecife.com.br/public/documentos/edital_home_138/Edital.pdf',
            label: 'EDITAL',
          },
        ],
      },
      {
        heading: '▸ 01/2026 | Games',
        links: [
          { url: 'https://www.culturarecife.com.br/public/documentos/games.pdf', label: 'EDITAL' },
          { url: page, label: 'não é título' },
        ],
      },
    ]);
  });
});
