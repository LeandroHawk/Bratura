import { describe, expect, it } from 'vitest';
import { contrastRatioFromHex } from './contrast';

describe('contrastRatioFromHex', () => {
  it('gives 21 for black on white and 1 for a color on itself', () => {
    expect(contrastRatioFromHex('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatioFromHex('#6b4226', '#6b4226')).toBe(1);
  });

  it('is symmetric and accepts the short #rgb form', () => {
    expect(contrastRatioFromHex('#fff', '#777')).toBeCloseTo(
      contrastRatioFromHex('#777777', '#ffffff'),
      10,
    );
  });

  it('matches a known WCAG value (#767676 on white is the 4.5 threshold)', () => {
    expect(contrastRatioFromHex('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
  });

  it('rejects values that are not hex colors', () => {
    expect(() => contrastRatioFromHex('red', '#fff')).toThrow('Not a hex color');
  });
});
