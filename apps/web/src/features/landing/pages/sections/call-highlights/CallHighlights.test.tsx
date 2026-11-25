import type { CallNoticeHighlight } from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-highlights/query';
import { ianaTimeZone } from '@bratura/shared/primitives/code/time/time-zone/fields';
import { fetchQuery } from 'convex/nextjs';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { revalidate } from '@/app/[lang]/page';
import { CALL_NOTICE_FLAG_LABELS } from '@/features/common/content/call-notice-flags';
import { CallHighlights, CALL_HIGHLIGHTS_REVALIDATE_SECONDS } from './CallHighlights';
import { CALL_HIGHLIGHTS_CONTENT } from './content';

// The page reads its locale through `next/root-params`, which only the Next compiler provides.
vi.mock('next/root-params', () => ({ lang: async () => 'pt-BR' }));
// The backend's answer is the test's to give; Next's cache would keep the first one.
vi.mock('convex/nextjs', () => ({ fetchQuery: vi.fn() }));
vi.mock('next/cache', () => ({ unstable_cache: (read: () => unknown) => read }));

const call = (overrides: Partial<CallNoticeHighlight>): CallNoticeHighlight => ({
  callNoticeId: 'j572n0h0brjjmmf7ybwk3s1rh58jhjhn' as CallNoticeHighlight['callNoticeId'],
  title: 'EDITAL DE FOMENTO ÀS ARTES',
  officialUrl: 'https://mapacultural.secult.ce.gov.br/oportunidade/8537/',
  registrationOpens: null,
  registrationCloses: {
    at: 1795575540000,
    precision: 'minute',
    timeZone: ianaTimeZone.parse('America/Fortaleza'),
  },
  firstSeenAt: 1795078845770,
  organizer: 'Mapas Culturais — Ceará',
  deadline: 'open',
  closesSoon: false,
  isNew: false,
  largestAmountPerProjectInCents: null,
  artForms: [],
  ...overrides,
});

afterEach(() => vi.unstubAllEnvs());

/** How many calls the board shows: each one is a list item. */
const pinnedCount = (html: string) => html.match(/<li\b/g)?.length ?? 0;

const highlightsOf = async (calls: CallNoticeHighlight[]) => {
  vi.mocked(fetchQuery).mockResolvedValue(calls);
  return renderToStaticMarkup(await CallHighlights({ locale: 'pt-BR' }));
};

test.each(['pt-BR', 'en'] as const)(
  'with no backend configured, the highlights say they are unavailable in %s',
  async (locale) => {
    vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', '');
    const html = renderToStaticMarkup(await CallHighlights({ locale }));
    expect(html).toContain(CALL_HIGHLIGHTS_CONTENT[locale].unavailable);
  },
);

test('the landing is rebuilt as often as its highlights are kept', () => {
  expect(revalidate).toBe(CALL_HIGHLIGHTS_REVALIDATE_SECONDS);
});

describe('with a backend', () => {
  beforeEach(() => vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', 'https://example.convex.cloud'));

  test('no open call with a close: says so, with no board', async () => {
    const html = await highlightsOf([]);
    expect(html).toContain(CALL_HIGHLIGHTS_CONTENT['pt-BR'].empty);
    expect(pinnedCount(html)).toBe(0);
  });

  test('each call is pinned with its official link', async () => {
    const html = await highlightsOf([
      call({}),
      call({
        callNoticeId: 'j57b4wwwc3e9bk2fvzydb1yy998jgs5r' as CallNoticeHighlight['callNoticeId'],
      }),
    ]);
    expect(pinnedCount(html)).toBe(2);
    expect(
      html.match(/href="https:\/\/mapacultural\.secult\.ce\.gov\.br\/oportunidade\/8537\/"/g),
    ).toHaveLength(2);
  });

  test('a call closing soon is stamped so, even when it is also new', async () => {
    const html = await highlightsOf([call({ closesSoon: true, isNew: true })]);
    expect(html).toContain(CALL_NOTICE_FLAG_LABELS['pt-BR'].closesSoon);
    expect(html).not.toContain(`>${CALL_NOTICE_FLAG_LABELS['pt-BR'].isNew}<`);
  });

  test('a new call is stamped new, and a call neither new nor closing soon has no stamp', async () => {
    expect(await highlightsOf([call({ isNew: true })])).toContain(
      `>${CALL_NOTICE_FLAG_LABELS['pt-BR'].isNew}<`,
    );
    const plain = await highlightsOf([call({})]);
    expect(plain).not.toContain(CALL_NOTICE_FLAG_LABELS['pt-BR'].closesSoon);
    expect(plain).not.toContain(`>${CALL_NOTICE_FLAG_LABELS['pt-BR'].isNew}<`);
  });
});
