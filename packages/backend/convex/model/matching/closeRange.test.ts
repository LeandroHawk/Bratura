import { CallNoticeCloseFilterEnum } from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-cards/query';
import { matchClosesAtWithoutClose } from '@bratura/shared/entities/match/entity';
import { describe, expect, test } from 'vitest';
import { closeRange, closeRangeStepInMs, isInCloseFilter } from './closeRange';

const NOW = Date.UTC(2026, 10, 15, 15, 20);
const minuteInMs = 60 * 1000;
const dayInMs = 24 * 60 * minuteInMs;

describe('closeRange', () => {
  test.each(CallNoticeCloseFilterEnum.options)(
    '%s: two reads in the same step have the same bounds, so a cursor continues',
    (closes) => {
      expect(closeRange({ closes, now: NOW + 30 * minuteInMs })).toEqual(
        closeRange({ closes, now: NOW }),
      );
      expect(closeRange({ closes, now: NOW + closeRangeStepInMs })).not.toEqual(
        closeRange({ closes, now: NOW }),
      );
    },
  );

  test.each(CallNoticeCloseFilterEnum.options)(
    '%s: the bounds hold every call the filter keeps',
    (closes) => {
      const { from, to } = closeRange({ closes, now: NOW });
      const closings = [
        NOW - 40 * dayInMs,
        NOW - 1,
        NOW,
        NOW + 7 * dayInMs,
        NOW + 30 * dayInMs,
        NOW + 31 * dayInMs,
        matchClosesAtWithoutClose,
      ];
      for (const closesAt of closings.filter((at) =>
        isInCloseFilter({ closes, closesAt: at, now: NOW }),
      ))
        expect(closesAt >= from && closesAt <= to).toBe(true);
    },
  );
});

describe('isInCloseFilter', () => {
  test('a call that closed a minute ago is closed, though the bounds still hold it', () => {
    const closesAt = NOW - minuteInMs;
    expect(closeRange({ closes: 'stillOpen', now: NOW }).from).toBeLessThan(closesAt);
    expect(isInCloseFilter({ closes: 'stillOpen', closesAt, now: NOW })).toBe(false);
    expect(isInCloseFilter({ closes: 'closed', closesAt, now: NOW })).toBe(true);
  });

  test('within 7 days ends at the seventh day; still open keeps a call with no close', () => {
    const inEightDays = NOW + 8 * dayInMs;
    expect(isInCloseFilter({ closes: 'within7Days', closesAt: NOW + 7 * dayInMs, now: NOW })).toBe(
      true,
    );
    expect(isInCloseFilter({ closes: 'within7Days', closesAt: inEightDays, now: NOW })).toBe(false);
    expect(isInCloseFilter({ closes: 'within30Days', closesAt: inEightDays, now: NOW })).toBe(true);
    expect(
      isInCloseFilter({ closes: 'stillOpen', closesAt: matchClosesAtWithoutClose, now: NOW }),
    ).toBe(true);
  });
});
