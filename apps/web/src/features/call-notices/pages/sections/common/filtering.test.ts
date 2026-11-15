import { describe, expect, it } from 'vitest';
import { callNoticesWithMatch } from '@/features/call-notices/data/callNoticesWithMatch';
import { EXAMPLE_CREATOR, EXAMPLE_PORTFOLIO_ITEMS } from '@/features/common/data/exampleCreator';
import {
  callNoticeStatus,
  emptyCallNoticeFilters,
  filteredCallNotices,
  type CallNoticeFilterValues,
} from './filtering';

const NOW = Date.UTC(2026, 10, 15, 15);
const CALL_NOTICES = callNoticesWithMatch(
  { creator: EXAMPLE_CREATOR, portfolioItems: EXAMPLE_PORTFOLIO_ITEMS },
  NOW,
);

function idsWith(filters: Partial<CallNoticeFilterValues>, savedIds: string[] = []) {
  return filteredCallNotices(
    CALL_NOTICES,
    { ...emptyCallNoticeFilters, sort: 'alphabetical', ...filters },
    new Set(savedIds),
    NOW,
  ).map((callNotice) => callNotice.callNoticeId);
}

describe('filteredCallNotices', () => {
  it('keeps every call when no filter is set', () => {
    expect(idsWith({})).toHaveLength(CALL_NOTICES.length);
  });

  it('searches title, organizer and summary without minding accents or case', () => {
    expect(idsWith({ search: 'MUSICA' })).toEqual(['exemplo-festival-de-musica']);
    expect(idsWith({ search: 'fundacao' })).toEqual(['exemplo-mestres-da-cultura']);
  });

  it('a call open to every area passes any cultural area filter', () => {
    expect(idsWith({ culturalArea: 'music' })).toContain('exemplo-fomento-mei-cultural');
    expect(idsWith({ culturalArea: 'music' })).not.toContain('exemplo-feiras-de-artesanato');
  });

  it('filters by status, classification and saved', () => {
    expect(idsWith({ status: 'closed' })).toEqual(['exemplo-circula-artes']);
    expect(idsWith({ status: 'closingSoon' })).toEqual(['exemplo-mestres-da-cultura']);
    for (const id of idsWith({ classification: 'almostEligible' }))
      expect(
        CALL_NOTICES.find((callNotice) => callNotice.callNoticeId === id)?.match?.classification,
      ).toBe('almostEligible');
    expect(idsWith({ onlySaved: true }, ['exemplo-circula-artes'])).toEqual([
      'exemplo-circula-artes',
    ]);
  });

  it('"closes within" leaves out closed calls and calls without a deadline', () => {
    const ids = idsWith({ closesWithinDays: '30' });
    expect(ids).toContain('exemplo-mestres-da-cultura');
    expect(ids).not.toContain('exemplo-circula-artes');
    expect(ids).not.toContain('exemplo-oficinas-nas-escolas');
  });

  it('sorts the best fit first and the calls without a match last', () => {
    const ids = idsWith({ sort: 'bestMatch' });
    expect(ids.at(-1)).toBe('exemplo-oficinas-nas-escolas');
    const order = ids.map(
      (id) =>
        CALL_NOTICES.find((callNotice) => callNotice.callNoticeId === id)?.match?.classification,
    );
    expect(order.indexOf('notEligible')).toBeGreaterThan(order.lastIndexOf('almostEligible'));
  });

  it('sorts the closest deadline first, with closed calls after the open ones', () => {
    const ids = idsWith({ sort: 'closestDeadline' });
    expect(ids[0]).toBe('exemplo-mestres-da-cultura');
    expect(ids.indexOf('exemplo-circula-artes')).toBeGreaterThan(
      ids.indexOf('exemplo-patrocinio-empresas'),
    );
  });
});

describe('callNoticeStatus', () => {
  it('names the four places a registration can be', () => {
    expect(callNoticeStatus({ deadline: 'open', closesSoon: false })).toBe('open');
    expect(callNoticeStatus({ deadline: 'open', closesSoon: true })).toBe('closingSoon');
    expect(callNoticeStatus({ deadline: 'openEnded', closesSoon: false })).toBe('open');
    expect(callNoticeStatus({ deadline: 'closed', closesSoon: false })).toBe('closed');
    expect(callNoticeStatus({ deadline: 'notInformed', closesSoon: false })).toBe('notInformed');
  });
});
