import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Collapse } from './Collapse';

const contentOf = (html: string) => html.slice(html.indexOf('class="bt-drawer-body"'));

describe('Collapse', () => {
  it('puts the one toggle inside the heading, before the content, closed by default', () => {
    const html = renderToStaticMarkup(<Collapse title="Vagas reservadas">conteúdo</Collapse>);
    expect(html).toMatch(/^<div class="bt-drawer"><h3[^>]*><button[^>]*aria-expanded="false"/);
    expect(html.indexOf('<h3')).toBeLessThan(html.indexOf('conteúdo'));
    expect(contentOf(html)).toMatch(/<div id="[^"]+" class="bt-drawer-box" hidden="">/);
  });

  it('starts open only when asked, its content reachable', () => {
    const html = renderToStaticMarkup(
      <Collapse title="Sobre" defaultOpen>
        conteúdo
      </Collapse>,
    );
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('data-open=""');
    expect(contentOf(html)).toMatch(/class="bt-drawer-box">/);
  });

  it('points the toggle at the content it opens', () => {
    const html = renderToStaticMarkup(<Collapse title="Sobre">conteúdo</Collapse>);
    const controls = html.match(/aria-controls="([^"]+)"/)?.[1];
    expect(controls).toBeTruthy();
    expect(html).toContain(`id="${controls}"`);
  });

  it('says the title once, and keeps the pull, a second click target, out of the tab order', () => {
    const html = renderToStaticMarkup(<Collapse title="Sobre">conteúdo</Collapse>);
    expect(html.match(/Sobre/g)).toHaveLength(1);
    expect(html).toMatch(
      /<button type="button" tabindex="-1" aria-hidden="true" class="bt-drawer-edge"><svg/,
    );
  });

  it('shows the count beside the title and hides the pull from screen readers', () => {
    const html = renderToStaticMarkup(
      <Collapse title="Critérios" count={4}>
        conteúdo
      </Collapse>,
    );
    expect(html).toContain('Critérios<span class="font-body font-normal"> (4)</span>');
    expect(html).toContain('<svg viewBox="0 0 52 18" class="bt-drawer-pull" aria-hidden="true">');
  });
});
