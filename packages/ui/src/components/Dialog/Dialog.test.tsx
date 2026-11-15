import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Dialog } from './Dialog';

describe('Dialog', () => {
  const html = renderToStaticMarkup(
    <Dialog open={false} onClose={() => {}} title="Nova experiência" closeLabel="Fechar">
      conteúdo
    </Dialog>,
  );

  it('is the platform’s dialog, named by its title', () => {
    const titleId = html.match(/<dialog class="bt-dialog" aria-labelledby="([^"]+)"/)?.[1];
    expect(titleId).toBeTruthy();
    expect(html).toContain(`<h2 id="${titleId}"`);
  });

  it('stays closed until opened as a modal: no `open` attribute in the markup', () => {
    expect(html).not.toMatch(/<dialog[^>]* open/);
  });

  it('has a close button with a name', () => {
    expect(html).toMatch(/<button type="button" aria-label="Fechar"/);
  });

  it('says its title’s language when it is not the page’s', () => {
    const quoted = renderToStaticMarkup(
      <Dialog open={false} onClose={() => {}} title="Edital" titleLang="pt-BR" closeLabel="Close">
        content
      </Dialog>,
    );
    expect(quoted).toMatch(/<h2 id="[^"]+" lang="pt-BR"/);
    expect(html).not.toContain('lang=');
  });
});
