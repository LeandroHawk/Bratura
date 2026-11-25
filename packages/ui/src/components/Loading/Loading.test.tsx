import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Loading } from './Loading';

describe('Loading', () => {
  it('is a status named by its visible label, the breathing mark hidden', () => {
    const html = renderToStaticMarkup(<Loading label="Abrindo seu portfólio…" />);
    expect(html).toMatch(/^<div role="status" class="bt-loading /);
    expect(html).toContain('<span class="bt-loading-mark" aria-hidden="true">');
    expect(html).toContain('<span class="bt-loading-label">Abrindo seu portfólio…</span>');
  });
});
