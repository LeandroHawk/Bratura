import { describe, expect, test } from 'vitest';
import { headingOfHtml, linksOfHtml, sectionsOfHtml } from './html';

describe('linksOfHtml', () => {
  const page = 'https://www.ba.gov.br/fundacaocultural/editais-2026';

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
});

describe('headingOfHtml', () => {
  test("the first heading's text, empty when the page has none (Salvador)", () => {
    const page = '<title>X – FGM</title><h1 class="t">Edital <b>09</b></h1><h1>FALE CONOSCO</h1>';
    expect(headingOfHtml(page)).toBe('Edital 09');
    expect(headingOfHtml('<title>Edital 09 – FGM</title><p>sem título</p>')).toBe('');
  });
});

describe('sectionsOfHtml', () => {
  test('a link inside a heading is still a link, of that heading', () => {
    const html = '<h2><a href="/edital-03">Edital 03/2026</a></h2><a href="/e.pdf">PDF</a>';
    const page = 'https://cultura.pontagrossa.pr.gov.br/';
    expect(linksOfHtml(html, page).map(({ url }) => url)).toEqual([
      'https://cultura.pontagrossa.pr.gov.br/edital-03',
      'https://cultura.pontagrossa.pr.gov.br/e.pdf',
    ]);
    expect(sectionsOfHtml(html, page)[0]?.heading).toBe('Edital 03/2026');
  });

  test('each link goes under the heading above it, once; a link above every heading goes nowhere', () => {
    const page = 'https://cultura.jundiai.sp.gov.br/editais-e-regulamentos/';
    const html = [
      '<a href="/decreto.pdf">Decreto</a><h1>Editais</h1>',
      '<h1>BLOCOS DE CARNAVAL</h1><p>Período</p><a href="/b.pdf">PDF</a><a href="/b.pdf">Edital</a>',
      '<h2>ENCERRADOS</h2><h1>CORTE <em>AFRO</em></h1><a href="/c.pdf">Edital</a>',
    ].join('');
    expect(sectionsOfHtml(html, page)).toEqual([
      { heading: 'Editais', links: [] },
      {
        heading: 'BLOCOS DE CARNAVAL',
        links: [{ url: 'https://cultura.jundiai.sp.gov.br/b.pdf', label: 'PDF' }],
      },
      { heading: 'ENCERRADOS', links: [] },
      {
        heading: 'CORTE AFRO',
        links: [{ url: 'https://cultura.jundiai.sp.gov.br/c.pdf', label: 'Edital' }],
      },
    ]);
  });
});
