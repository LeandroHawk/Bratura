import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HangingSign } from './HangingSign';

const sign = (
  <HangingSign
    href="/en"
    hrefLang="en"
    front={{ label: 'English', hint: 'read in English', lang: 'en' }}
    back={{ label: 'Português', hint: 'ler em português', lang: 'pt-BR' }}
  />
);

describe('HangingSign', () => {
  it('is a real link to the other page, marked with its language', () => {
    const html = renderToStaticMarkup(sign);
    expect(html).toMatch(/^<a href="\/en" hrefLang="en" lang="en"/);
  });

  it('hides the back face from screen readers, so the link is named by the front only', () => {
    const html = renderToStaticMarkup(sign);
    expect(html).toContain(
      '<span class="bt-sign-board is-back" lang="pt-BR" aria-hidden="true"><span class="bt-sign-label">Português',
    );
  });
});
