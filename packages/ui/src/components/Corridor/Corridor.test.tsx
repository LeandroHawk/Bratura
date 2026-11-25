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

  it('names each door by its plaque only: the drawn door is hidden', () => {
    expect(corridor.match(/<span class="bt-door[^"]*" aria-hidden="true">/g)).toHaveLength(3);
    expect(corridor).toContain(
      '<span class="bt-room-plaque-caption">Sala 1</span><span class="bt-room-plaque-name"><a href="/portfolio" aria-current="page">Portfólio</a>',
    );
  });

  it('hangs the exit over the last door', () => {
    expect(corridor).toContain(
      '<div class="bt-corridor-exit"><button type="button">Saída</button><span class="bt-door is-exit"',
    );
  });
});
