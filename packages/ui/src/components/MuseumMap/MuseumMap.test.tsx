import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MuseumMap, MuseumMapRoom, MuseumMapRooms } from './MuseumMap';

const copy = {
  label: 'Mapa',
  title: 'Mapa do museu',
  closeLabel: 'Fechar o mapa',
  here: 'Você está aqui',
};

const map = renderToStaticMarkup(
  <MuseumMap copy={copy} plaque={{ number: '1', caption: 'Sala 1', name: 'Portfólio' }}>
    <MuseumMapRooms exit={<button type="button">Saída</button>}>
      <MuseumMapRoom caption="Sala 1" current fixture={<i>cord</i>}>
        <a href="/portfolio" aria-current="page">
          Portfólio
        </a>
      </MuseumMapRoom>
      <MuseumMapRoom caption="Sala 2">
        <a href="/compatibilidade">Editais para você</a>
      </MuseumMapRoom>
    </MuseumMapRooms>
  </MuseumMap>,
);

describe('MuseumMap', () => {
  it('is a button that says it opens a dialog, named by the plaque without its brass number', () => {
    expect(map).toContain(
      '<button type="button" class="bt-map-plaque focus-ring" aria-haspopup="dialog" aria-expanded="false">',
    );
    expect(map).toContain('<span class="bt-map-number" aria-hidden="true">1</span>');
    expect(map).toContain('<span class="bt-map-name">Portfólio</span>');
  });

  it('unfolds into a dialog named by its heading, with a named close button', () => {
    const titleId = /<dialog class="bt-modal bt-map-sheet" aria-labelledby="([^"]+)"/.exec(
      map,
    )?.[1];
    expect(titleId).toBeDefined();
    expect(map).toContain(`<h2 id="${titleId}"`);
    expect(map).toContain('aria-label="Fechar o mapa"');
  });

  it('marks "you are here" and hangs the fixture in the current room only', () => {
    expect(map.match(/class="bt-map-here"/g)).toHaveLength(1);
    expect(map).toContain('Você está aqui</span>');
    expect(map.match(/class="bt-map-fixture"/g)).toHaveLength(1);
    expect(map).toContain('<li class="bt-map-room is-current">');
  });

  it('puts the exit at the plan’s door', () => {
    expect(map).toContain('<div class="bt-map-exit"><button type="button">Saída</button></div>');
  });
});
