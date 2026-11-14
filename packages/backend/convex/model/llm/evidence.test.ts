import { describe, expect, test } from 'vitest';
import { amountAppearsInQuote, dateAppearsInQuote, quoteAppearsInText } from './evidence';

const text = 'Inscrições até 20/11/2026.\n\nValor:   R$ 5.000,00 por projeto.';

describe('quoteAppearsInText', () => {
  test('a quote copied from the text passes, however the lines broke', () => {
    expect(quoteAppearsInText('Valor: R$ 5.000,00', text)).toBe(true);
    expect(quoteAppearsInText('20/11/2026. Valor:', text)).toBe(true);
  });

  test('a quote the text does not hold fails: the model made it up or was told to', () => {
    expect(quoteAppearsInText('Valor: R$ 50.000,00', text)).toBe(false);
  });

  test('an empty quote fails', () => {
    expect(quoteAppearsInText('  ', text)).toBe(false);
  });
});

describe('amountAppearsInQuote', () => {
  const backs = (amountInCents: number, quote: string) =>
    amountAppearsInQuote({ amountInCents, quote });

  test('reads the ways a call notice writes an amount', () => {
    expect(backs(500_000, 'Valor: R$ 5.000,00 por projeto')).toBe(true);
    expect(backs(500_000, 'até R$5.000')).toBe(true);
    expect(backs(500_000, 'prêmio de R$ 5 mil')).toBe(true);
    expect(backs(123_456, 'R$ 1.234,56')).toBe(true);
    expect(backs(150_000_000, 'total de 1,5 milhão')).toBe(true);
    expect(backs(250_000_000, 'R$ 2,5 milhões no total')).toBe(true);
  });

  test('a quote with another number does not back the field', () => {
    expect(backs(500_000, 'Valor: R$ 50.000,00 por projeto')).toBe(false);
    expect(backs(500_000, 'R$ 5.000.000,00')).toBe(false);
  });

  test('a spelled-out amount alone is not read; written in digits beside it, it is', () => {
    expect(backs(500_000, 'cinco mil reais')).toBe(false);
    expect(backs(500_000, 'R$ 5.000,00 (cinco mil reais)')).toBe(true);
  });

  test('"mil" counts only as a word of its own', () => {
    expect(backs(500_000, '5 milímetros')).toBe(false);
  });

  test('a zero, negative or fractional amount never passes', () => {
    expect(backs(0, 'R$ 0,00')).toBe(false);
    expect(backs(-500_000, 'R$ 5.000,00')).toBe(false);
    expect(backs(0.5, 'R$ 0,005')).toBe(false);
  });
});

describe('dateAppearsInQuote', () => {
  const backs = (date: string, quote: string) => dateAppearsInQuote({ date, quote });

  test('reads the ways a call notice writes a date', () => {
    expect(backs('2026-11-20', 'Inscrições até 20/11/2026.')).toBe(true);
    expect(backs('2026-11-20', 'até 20.11.2026')).toBe(true);
    expect(backs('2026-11-20', 'até 20-11-26')).toBe(true);
    expect(backs('2026-11-20', 'prazo: 2026-11-20')).toBe(true);
    expect(backs('2026-11-20', 'até 20 de novembro de 2026, às 18h')).toBe(true);
    expect(backs('2026-12-01', 'encerra em 1º de dezembro de 2026')).toBe(true);
    expect(backs('2027-03-01', '1° de Março de 2027')).toBe(true);
  });

  test('a window backs each of its ends, and no other day', () => {
    const window = 'de 01/11/2026 a 20/11/2026';
    expect(backs('2026-11-01', window)).toBe(true);
    expect(backs('2026-11-20', window)).toBe(true);
    expect(backs('2026-11-21', window)).toBe(false);
  });

  test('a quote without the year never backs a date', () => {
    expect(backs('2026-11-20', 'até 20 de novembro')).toBe(false);
    expect(backs('2026-11-20', 'até 20/11')).toBe(false);
  });
});
