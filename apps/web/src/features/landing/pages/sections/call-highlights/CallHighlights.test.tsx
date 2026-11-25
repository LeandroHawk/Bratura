import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import { CallHighlights } from './CallHighlights';
import { CALL_HIGHLIGHTS_CONTENT } from './content';

test.each(['pt-BR', 'en'] as const)(
  'with no backend configured, the highlights say they are unavailable in %s',
  async (locale) => {
    vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', '');
    const html = renderToStaticMarkup(await CallHighlights({ locale }));
    expect(html).toContain(CALL_HIGHLIGHTS_CONTENT[locale].unavailable);
    vi.unstubAllEnvs();
  },
);
