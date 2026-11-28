import { expect, test } from 'vitest';
import { quoteRepeatsWording } from './quoteRepeatsWording';

test.each([
  ['Formulário de inscrição (Anexo II)', 'a) Formulário de inscrição (Anexo II)'],
  ['Anexo IV - Termo de Execução Cultural', 'Anexo IV - Termo de Execução Cultural;'],
  ['Comprovante de inscrição no CNPJ', 'II - Comprovante de inscrição no CNPJ'],
  ['Cada OSC poderá apresentar uma proposta', '7.4.4. Cada OSC poderá apresentar uma proposta.'],
  ['certidão negativa', 'CERTIDAO NEGATIVA'],
])('the passage of %s only repeats it', (wording, quote) => {
  expect(quoteRepeatsWording(wording, quote)).toBe(true);
});

test.each([
  ['município de Reriutaba', 'residir no município de Reriutaba há 2 anos'],
  ['Recibo de Premiação Cultural', 'assinatura do Recibo de Premiação Cultural.'],
  ['Comprovante de residência', 'Comprovante de residência dos últimos 3 meses'],
  ['CPF', 'cópia do CPF'],
  ['', 'qualquer trecho'],
])('the passage of %s adds words, so it stays', (wording, quote) => {
  expect(quoteRepeatsWording(wording, quote)).toBe(false);
});
