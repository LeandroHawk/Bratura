import { describe, expect, test } from 'vitest';
import { ZonedInstantSchema } from './fields';

const closesInAcre = {
  at: Date.UTC(2026, 10, 21, 4, 59),
  timeZone: 'America/Rio_Branco',
  precision: 'minute',
};

describe('ZonedInstantSchema', () => {
  test('keeps the zone the source wrote the time in', () => {
    expect(ZonedInstantSchema.parse(closesInAcre)).toEqual(closesInAcre);
  });

  test('accepts a time the source gave only as a day', () => {
    expect(ZonedInstantSchema.safeParse({ ...closesInAcre, precision: 'day' }).success).toBe(true);
  });

  test('refuses a zone the runtime does not know', () => {
    const result = ZonedInstantSchema.safeParse({ ...closesInAcre, timeZone: 'America/Atlantis' });
    expect(result.error?.issues[0]).toMatchObject({
      path: ['timeZone'],
      params: { message: 'unknownTimeZone' },
    });
  });

  test('refuses an offset where a zone is expected', () => {
    expect(ZonedInstantSchema.safeParse({ ...closesInAcre, timeZone: '-05:00' }).success).toBe(
      false,
    );
  });

  test('refuses an instant that is not a whole millisecond count', () => {
    expect(ZonedInstantSchema.safeParse({ ...closesInAcre, at: 1.5 }).success).toBe(false);
    expect(ZonedInstantSchema.safeParse({ ...closesInAcre, at: -1 }).success).toBe(false);
  });
});
