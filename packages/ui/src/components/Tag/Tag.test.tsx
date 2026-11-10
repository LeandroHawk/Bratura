import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Tag } from './Tag';

describe('Tag', () => {
  it('renders as a list item when it is one', () => {
    expect(renderToStaticMarkup(<Tag as="li">SICAB</Tag>)).toMatch(/^<li [^>]*>SICAB<\/li>$/);
  });

  it('takes its border from the text colour, so it needs no colour of its own', () => {
    expect(renderToStaticMarkup(<Tag>SICAB</Tag>)).toContain('border-current/25');
  });
});
