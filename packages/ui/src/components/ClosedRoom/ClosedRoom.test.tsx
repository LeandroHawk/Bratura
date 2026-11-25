import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ClosedRoom } from './ClosedRoom';

describe('ClosedRoom', () => {
  const html = renderToStaticMarkup(
    <ClosedRoom
      title="Sala em restauro"
      message="Os editais não carregaram agora."
      action={<button type="button">Tentar de novo</button>}
    />,
  );

  it('is a status that reads the plaque, the message and the action as text', () => {
    expect(html).toMatch(/^<div role="status" class="bt-closed /);
    expect(html).toContain('<p class="bt-closed-plaque walnut-plaque">Sala em restauro</p>');
    expect(html).toContain('<p class="bt-closed-message">Os editais não carregaram agora.</p>');
    expect(html).toContain('<button type="button">Tentar de novo</button>');
  });

  it('hides the stanchions and the rope from screen readers', () => {
    expect(html.match(/class="bt-closed-post[^"]*" aria-hidden="true"/g)).toHaveLength(2);
    expect(html).toContain('<svg class="bt-closed-rope" viewBox="0 0 200 40" aria-hidden="true">');
  });
});
