import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Corridor, CorridorDoor } from './Corridor';

const corridor = renderToStaticMarkup(
  <Corridor exit={<button type="button">Saída</button>}>
    <CorridorDoor caption="Sala 1" current>
      <a href="/portfolio" aria-current="page">
        Portfólio
      </a>
    </CorridorDoor>
    <CorridorDoor caption="Sala 2">
      <a href="/compatibilidade">Editais para você</a>
    </CorridorDoor>
  </Corridor>,
);

describe('Corridor', () => {
  it('is a list with one item per door, the current one open', () => {
    expect(corridor.match(/<li class="bt-corridor-room/g)).toHaveLength(2);
    expect(corridor).toContain('<li class="bt-corridor-room is-current">');
  });

  it('names each door by the name lettered on it only: the drawn door is hidden', () => {
    expect(corridor.match(/<span class="bt-door[^"]*" aria-hidden="true">/g)).toHaveLength(3);
    expect(corridor).toContain(
      '<span class="bt-door-label"><span class="bt-door-caption walnut-plaque">Sala 1</span><span class="bt-door-name"><a href="/portfolio" aria-current="page">Portfólio</a>',
    );
  });

  it('gives each room a double door, its leaves hinged on either jamb', () => {
    expect(corridor.match(/<span class="bt-door-leaf is-right">/g)).toHaveLength(2);
  });

  it('hangs the exit sign on the last door', () => {
    expect(corridor).toMatch(
      /<span class="bt-door-bar"><\/span><\/span><\/span><span class="bt-door-label"><button type="button">Saída<\/button><\/span><\/div>/,
    );
  });
});
