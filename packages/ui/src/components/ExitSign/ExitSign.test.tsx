import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ExitSign } from './ExitSign';

describe('ExitSign', () => {
  it('is a button named by its visible word and hint, the pictogram hidden', () => {
    const html = renderToStaticMarkup(<ExitSign label="Saída" hint="sair da demonstração" />);
    expect(html).toMatch(/^<button type="button" class="bt-exit focus-ring\s/);
    expect(html).toContain('<svg class="bt-exit-figure" viewBox="0 0 32 24" aria-hidden="true">');
    expect(html).toContain(
      '<span class="bt-exit-label">Saída</span><span class="bt-exit-hint">sair da demonstração</span>',
    );
  });

  it('has a compact size for the corridor’s scale', () => {
    const html = renderToStaticMarkup(<ExitSign label="Saída" size="compact" />);
    expect(html).toMatch(/^<button type="button" class="bt-exit focus-ring is-compact/);
  });
});
