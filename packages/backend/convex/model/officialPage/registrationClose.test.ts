import { ianaTimeZone } from '@bratura/shared/primitives/code/time/time-zone/fields';
import { describe, expect, test } from 'vitest';
import { registrationClosePrintedIn } from './registrationClose';

const saoPaulo = ianaTimeZone.parse('America/Sao_Paulo');
/** The day a close names, as `YYYY-MM-DD` in São Paulo, or `null`. */
function closeDay(text: string) {
  const close = registrationClosePrintedIn(text, saoPaulo);
  if (!close) return null;
  expect(close).toMatchObject({ timeZone: saoPaulo, precision: 'day' });
  return new Date(close.at - 3 * 60 * 60_000).toISOString().slice(0, 10);
}

describe('registrationClosePrintedIn', () => {
  test("the close is that day's end where the call is", () => {
    expect(registrationClosePrintedIn('Inscrições até 26/10/2026', saoPaulo)).toEqual({
      at: Date.UTC(2026, 9, 27, 2, 59, 59),
      timeZone: saoPaulo,
      precision: 'day',
    });
  });

  test.each([
    ['DF PNAB', 'Inscrições até 26/10/2026', '2026-10-26'],
    [
      'Paraná',
      'As inscrições estão abertas a partir do dia 28 de abril no SISPROFICE e prosseguem até o dia 31/05/2023',
      '2023-05-31',
    ],
    [
      'Salvador',
      'As inscrições estão abertas até as 23h59 de 25 de novembro de 2026, por meio deste link',
      '2026-11-25',
    ],
    [
      'Badesc, no "de"',
      'As inscrições são gratuitas e ficarão abertas de 16 de novembro de 2026 até 07 fevereiro de 2027.',
      '2027-02-07',
    ],
    [
      'Funarte, upper case',
      'INSCRIÇÕES: DE 03 DE NOVEMBRO DE 2026 A 18 DE DEZEMBRO DE 2026',
      '2026-12-18',
    ],
    [
      'Câmara',
      'As inscrições podem ser feitas desde 3 de agosto até 30 de novembro de 2026.',
      '2026-11-30',
    ],
    ['a range of days', 'Período de inscrições: 03/11 a 19/11/2026', '2026-11-19'],
    [
      'a weekday after the date',
      'Inscrições 13/11/2026 (sexta-feira) a 23/11/2026 (segunda-feira)',
      '2026-11-23',
    ],
    [
      'an hour in words',
      'inscrições até às 23 horas e 59 minutos do dia 30 de novembro de 2026',
      '2026-11-30',
    ],
    ['"1º"', 'Inscrições de 03 de novembro a 1º de dezembro de 2026', '2026-12-01'],
    ['a two-digit year', 'Inscrições até 10/11/26', '2026-11-10'],
  ])('%s', (_, text, day) => {
    expect(closeDay(text)).toBe(day);
  });

  test('a close named as such, never an opening (Sesc SE, MinC)', () => {
    expect(closeDay('Início das inscrições 01/07/2026 Término das inscrições 26/07/2026')).toBe(
      '2026-07-26',
    );
    expect(closeDay('Prazo de inscrição 13/10/2026, às 23h59min59s')).toBe('2026-10-13');
    expect(closeDay('Início das inscrições 01/07/2026')).toBeNull();
  });

  test("another stage's date is not the registration's (MinC)", () => {
    expect(
      closeDay(
        'Prazo de inscrição 13/10/2026, às 23h59min59s Divulgação do resultado provisório Até 27/11/2026',
      ),
    ).toBe('2026-10-13');
    expect(closeDay('As inscrições foram encerradas. O resultado sai até 27/11/2026')).toBeNull();
  });

  test('a close without its year makes the close unknown, even beside one with it (Secec-RJ, Badesc)', () => {
    expect(closeDay('As inscrições ficam abertas até as 18h do dia 13 de novembro')).toBeNull();
    expect(
      closeDay(
        'As inscrições ficarão abertas até 22 de março de 2021. Inscrições prorrogadas: Até 05 de abril',
      ),
    ).toBeNull();
  });

  test('a close without its year that repeats a dated one is that one (Porto Alegre)', () => {
    expect(
      closeDay(
        'O prazo vai até 8 de dezembro. Inscrições: De 16 de outubro a 8 de dezembro de 2026',
      ),
    ).toBe('2026-12-08');
  });

  test('a range ends at its second date, even when the first has no year', () => {
    expect(closeDay('Estão abertas as inscrições de 30 de março a 29 de novembro de 2026')).toBe(
      '2026-11-29',
    );
  });

  test('several closes: the latest (Mobilidades, a module per close)', () => {
    expect(
      closeDay(
        'Módulo I: inscrições até as 18h do dia 31 de outubro de 2026. Módulo III: inscrições até as 18h do dia 27 de fevereiro de 2027.',
      ),
    ).toBe('2027-02-27');
  });

  test.each([
    ['a duration', 'terá prazo de execução de até 10 meses'],
    ['an amount', 'Cada inscrição selecionada poderá receber até R$ 200 mil'],
    ['no registration word', 'O evento acontece até 30 de novembro de 2026'],
    ['a day that does not exist', 'Inscrições até 31/02/2026'],
    ['a call number', 'Inscrições do Edital 21/2026 abertas'],
  ])('none: %s', (_, text) => {
    expect(closeDay(text)).toBeNull();
  });
});
