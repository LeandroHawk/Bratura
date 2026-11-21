import { describe, expect, it } from 'vitest';
import { callNoticesWithMatch } from '@/features/call-notices/data/callNoticesWithMatch';
import {
  FICTIONAL_CREATOR,
  FICTIONAL_CREATOR_PORTFOLIO_ITEMS,
} from '@bratura/shared/entities/creator/demo/fictional-creator';
import {
  callNoticeStatus,
  emptyCallNoticeFilters,
  filteredCallNotices,
  type CallNoticeFilterValues,
} from './filtering';

const NOW = Date.UTC(2026, 10, 15, 15);
const CALL_NOTICES = callNoticesWithMatch(
  { creator: FICTIONAL_CREATOR, portfolioItems: FICTIONAL_CREATOR_PORTFOLIO_ITEMS },
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
  const opened = { registrationOpens: null, closesSoon: false };

  it('names the places a registration can be', () => {
    expect(callNoticeStatus({ ...opened, deadline: 'open' }, NOW)).toBe('open');
    expect(callNoticeStatus({ ...opened, deadline: 'open', closesSoon: true }, NOW)).toBe(
      'closingSoon',
    );
    expect(callNoticeStatus({ ...opened, deadline: 'openEnded' }, NOW)).toBe('open');
    expect(callNoticeStatus({ ...opened, deadline: 'closed' }, NOW)).toBe('closed');
    expect(callNoticeStatus({ ...opened, deadline: 'notInformed' }, NOW)).toBe('notInformed');
  });

  it('a call that opens later is not open, whatever its deadline', () => {
    expect(idsWith({ status: 'notYetOpen' })).toEqual(['exemplo-patrocinio-empresas']);
    expect(idsWith({ status: 'open' })).not.toContain('exemplo-patrocinio-empresas');
  });
});
