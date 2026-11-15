import { describe, expect, it } from 'vitest';
import { valuesFromDraft } from './formFields';

describe('valuesFromDraft', () => {
  it('keeps a comma inside a link, and gives a bare address its scheme', () => {
    const { links } = valuesFromDraft([{ name: 'links', control: 'links' }], {
      links: 'https://example.com/mapa?centro=-7.2,-39.3\n\n instagram.com/maria ',
    });
    expect(links).toEqual([
      'https://example.com/mapa?centro=-7.2,-39.3',
      'https://instagram.com/maria',
    ]);
  });

  it('reads a list of words typed with commas or lines', () => {
    const { techniques } = valuesFromDraft([{ name: 'techniques', control: 'lines' }], {
      techniques: 'renda de bilro, bordado\nlabirinto',
    });
    expect(techniques).toEqual(['renda de bilro', 'bordado', 'labirinto']);
  });
});
