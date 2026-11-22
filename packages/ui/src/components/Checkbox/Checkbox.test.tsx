import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('is a real checkbox inside its label, so the text toggles it', () => {
    const html = renderToStaticMarkup(<Checkbox name="reminders">Lembrar do prazo</Checkbox>);
    expect(html).toMatch(/^<label [^>]*>.*<input type="checkbox"[^>]*name="reminders"/);
    expect(html).toContain('<span>Lembrar do prazo</span></label>');
  });

  it("leaves the box's colours to checkbox.css: a colour utility would outrank its checked state", () => {
    const input = /<input[^>]*>/.exec(renderToStaticMarkup(<Checkbox>x</Checkbox>))?.[0] ?? '';
    expect(input).toContain('bt-checkbox-input');
    expect(input).not.toMatch(/\b(bg|border)-[a-z]/);
  });

  it('hides the drawn tick from screen readers: the input already says checked', () => {
    expect(renderToStaticMarkup(<Checkbox>x</Checkbox>)).toMatch(/<svg[^>]*aria-hidden="true"/);
  });
});
