import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import { revalidate } from '@/app/[lang]/page';
import { CallHighlights, CALL_HIGHLIGHTS_REVALIDATE_SECONDS } from './CallHighlights';
import { CALL_HIGHLIGHTS_CONTENT } from './content';

// The page reads its locale through `next/root-params`, which only the Next compiler provides.
vi.mock('next/root-params', () => ({ lang: async () => 'pt-BR' }));

test.each(['pt-BR', 'en'] as const)(
  'with no backend configured, the highlights say they are unavailable in %s',
  async (locale) => {
    vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', '');
    const html = renderToStaticMarkup(await CallHighlights({ locale }));
    expect(html).toContain(CALL_HIGHLIGHTS_CONTENT[locale].unavailable);
    vi.unstubAllEnvs();
  },
);

test('the landing is rebuilt as often as its highlights are kept', () => {
  expect(revalidate).toBe(CALL_HIGHLIGHTS_REVALIDATE_SECONDS);
});
