import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Logo, SLOGAN } from './Logo';

describe('Logo', () => {
  it('exposes the brand name and slogan to screen readers as one image', () => {
    const html = renderToStaticMarkup(<Logo />);
    expect(html).toContain('role="img"');
    expect(html).toContain(`aria-label="Bratura, ${SLOGAN}"`);
  });

  it('says a translated slogan in its own language', () => {
    const html = renderToStaticMarkup(
      <Logo slogan={{ text: 'your country with more culture', lang: 'en' }} />,
    );
    expect(html).toContain('lang="en"');
    expect(html).toContain('aria-label="Bratura, your country with more culture"');
    expect(html).toContain('>your country with more culture</textPath>');
  });

  it('drops the slogan when asked, for small sizes', () => {
    const html = renderToStaticMarkup(<Logo slogan={false} />);
    expect(html).toContain('aria-label="Bratura"');
    expect(html).not.toContain('textPath');
  });

  it('links the slogan to its own arc, so two logos on a page do not share an id', () => {
    const html = renderToStaticMarkup(
      <>
        <Logo />
        <Logo />
      </>,
    );
    const ids = [...html.matchAll(/<path id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) expect(html).toContain(`href="#${id}"`);
  });
});
