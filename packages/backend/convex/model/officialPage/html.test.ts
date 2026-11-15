import { describe, expect, test } from 'vitest';
import { linksOfHtml, pageTitleOfHtml } from './html';

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

describe('pageTitleOfHtml', () => {
  test('the first heading, else the title without the site name; a hyphen stays', () => {
    expect(pageTitleOfHtml('<title>X – FGM</title><h1 class="t">Edital <b>09</b></h1>')).toBe(
      'Edital 09',
    );
    expect(pageTitleOfHtml('<title>Edital 01/2026 - Dança &#8211; FGM Cultura</title>')).toBe(
      'Edital 01/2026 - Dança',
    );
    expect(pageTitleOfHtml('<h1> </h1><p>sem título</p>')).toBeNull();
  });
});
