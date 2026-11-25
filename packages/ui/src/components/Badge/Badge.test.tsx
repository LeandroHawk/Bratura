import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Badge } from './Badge';

describe('Badge', () => {
  it('fills the pill with the status colour by default', () => {
    expect(renderToStaticMarkup(<Badge tone="soon">Prazo curto</Badge>)).toContain(
      'bg-status-soon',
    );
  });

  it('draws a missing status in the muted text colour, never an alert colour', () => {
    const html = renderToStaticMarkup(<Badge tone="neutral">Não informado</Badge>);
    expect(html).toContain('text-muted-foreground');
    expect(html).not.toMatch(/bg-status-/);
  });

  it('puts the tone in a dot hidden from screen readers, so the text alone carries it', () => {
    const html = renderToStaticMarkup(
      <Badge tone="open" variant="dot">
        Inscrições abertas
      </Badge>,
    );
    expect(html).toContain(
      '<span aria-hidden="true" class="size-2 shrink-0 rounded-full bg-status-open"></span>',
    );
    expect(html).toContain('Inscrições abertas');
  });
});
