import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Heading } from './Heading';

describe('Heading', () => {
  it('keeps the document level and the visual size independent', () => {
    const html = renderToStaticMarkup(
      <Heading as="h3" size="section">
        Salas
      </Heading>,
    );
    expect(html.startsWith('<h3')).toBe(true);
    expect(html).toContain('text-3xl');
  });

  it('can look like a title without becoming one, for text inside an illustration', () => {
    expect(renderToStaticMarkup(<Heading as="p">Edital</Heading>).startsWith('<p')).toBe(true);
  });
});
