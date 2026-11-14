import { describe, expect, test } from 'vitest';
import { ianaTimeZone } from '../time/time-zone/fields';
import { instantFromPlainDateTimeInZone, plainDateInSaoPaulo } from './calendar';

describe('plainDateInSaoPaulo', () => {
  test('is still the previous day in São Paulo until 03:00 UTC', () => {
    expect(plainDateInSaoPaulo(Date.UTC(2026, 10, 15, 2, 59))).toBe('2026-11-14');
    expect(plainDateInSaoPaulo(Date.UTC(2026, 10, 15, 3))).toBe('2026-11-15');
  });
});

const midnight = { year: 2026, month: 11, day: 15, hour: 0, minute: 0, second: 0 };

describe('instantFromPlainDateTimeInZone', () => {
  test('reads a date and time in a named zone', () => {
    expect(instantFromPlainDateTimeInZone(midnight, ianaTimeZone.parse('America/Fortaleza'))).toBe(
      Date.UTC(2026, 10, 15, 3),
    );
  });

  test('reads the fixed-offset zones Mapas sends (Etc/GMT+3 is UTC−3)', () => {
    expect(instantFromPlainDateTimeInZone(midnight, ianaTimeZone.parse('Etc/GMT+3'))).toBe(
      Date.UTC(2026, 10, 15, 3),
    );
  });

  test('lands on the right side of an offset change', () => {
    // New York: 2026-03-08 03:00 is already daylight time (UTC−4).
    const afterChange = { ...midnight, month: 3, day: 8, hour: 3 };
    expect(
      instantFromPlainDateTimeInZone(afterChange, ianaTimeZone.parse('America/New_York')),
    ).toBe(Date.UTC(2026, 2, 8, 7));
  });
});
