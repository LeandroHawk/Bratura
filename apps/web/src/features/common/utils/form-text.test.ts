import { describe, expect, it, test } from 'vitest';
import { amountInCentsFromInput, linkFromInput, linksFromInput, inputFromLinks } from './form-text';

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

describe('linksFromInput', () => {
  it('splits links typed one per line or several on a line, keeping commas inside a link', () => {
    expect(
      linksFromInput(
        'instagram.com/maria  facebook.com/maria\n\nhttps://example.com/mapa?centro=-7.2,-39.3',
      ).map(linkFromInput),
    ).toEqual([
      'https://instagram.com/maria',
      'https://facebook.com/maria',
      'https://example.com/mapa?centro=-7.2,-39.3',
    ]);
  });
});

test.each([',', ';', ',;'])(
  'a trailing %s separates pasted links without altering coordinate commas',
  (separator) => {
    expect(
      linksFromInput(
        `instagram.com/maria${separator} facebook.com/maria${separator} https://example.com/?centro=-7.2,-39.3`,
      ).map(linkFromInput),
    ).toEqual([
      'https://instagram.com/maria',
      'https://facebook.com/maria',
      'https://example.com/?centro=-7.2,-39.3',
    ]);
  },
);

test.each([
  ['https://example.com/my portfolio', 'https://example.com/my%20portfolio'],
  ['https://example.com/my\tportfolio', 'https://example.com/myportfolio'],
  ['https://example.com/?centro=-7.2,-39.3', 'https://example.com/?centro=-7.2,-39.3'],
  ['https://instagram.com/maria,', 'https://instagram.com/maria'],
])('stored link %s survives an edit round trip', (stored, expected) => {
  expect(linksFromInput(inputFromLinks([stored])).map(linkFromInput)).toEqual([expected]);
});
