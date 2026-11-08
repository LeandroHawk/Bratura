import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Logo, SLOGAN } from './Logo';

describe('Logo', () => {
  it('exposes the brand name and slogan to screen readers as one image', () => {
    const html = renderToStaticMarkup(<Logo />);
    expect(html).toContain('role="img"');
    expect(html).toContain(`aria-label="Bratura, ${SLOGAN}"`);
  });

  it('drops the slogan when asked, for small sizes', () => {
    const html = renderToStaticMarkup(<Logo withSlogan={false} />);
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
