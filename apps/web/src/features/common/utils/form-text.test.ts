import { describe, expect, it } from 'vitest';
import { amountInCentsFromInput } from './form-text';

describe('amountInCentsFromInput', () => {
  it.each([
    ['1.500,00', 150_000],
    ['R$ 1.500,5', 150_050],
    ['1500', 150_000],
    ['1,500.50', 150_050],
    ['15.000', 1_500_000],
    ['0,99', 99],
  ])('reads %s as cents', (typed, cents) => {
    expect(amountInCentsFromInput(typed)).toBe(cents);
  });

  it('is null for an empty field', () => {
    expect(amountInCentsFromInput('  ')).toBeNull();
  });

  it.each(['1.500,005', '1.50.0', '1,5,0', '1.500.00,1', 'mil', '-5'])(
    'refuses %s instead of guessing an amount',
    (typed) => {
      expect(amountInCentsFromInput(typed)).toBeNaN();
    },
  );
});
