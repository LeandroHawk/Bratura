import { describe, expect, test } from 'vitest';
import { ianaTimeZone } from '../../../../primitives/code/time/time-zone/fields';
import { callNoticeDeadline, openEndedRegistrationAfterMs } from './fields';

const now = Date.UTC(2026, 10, 14, 12);

const closingAt = (at: number) => ({
  registrationCloses: {
    at,
    timeZone: ianaTimeZone.parse('America/Fortaleza'),
    precision: 'minute' as const,
  },
});

describe('callNoticeDeadline', () => {
  test('a close still ahead is open, up to the open-ended threshold', () => {
    expect(callNoticeDeadline(closingAt(now + 1), now)).toBe('open');
    expect(callNoticeDeadline(closingAt(now + openEndedRegistrationAfterMs), now)).toBe('open');
  });

  test('a close already past is closed', () => {
    expect(callNoticeDeadline(closingAt(now - 1), now)).toBe('closed');
  });

  test("Mapas's 2111-01-01 and other far closes mean no deadline", () => {
    expect(callNoticeDeadline(closingAt(Date.UTC(2111, 0, 1)), now)).toBe('openEnded');
    expect(callNoticeDeadline(closingAt(now + openEndedRegistrationAfterMs + 1), now)).toBe(
      'openEnded',
    );
  });

  test('a source that gives no close is not informed', () => {
    expect(callNoticeDeadline({ registrationCloses: null }, now)).toBe('notInformed');
  });
});
