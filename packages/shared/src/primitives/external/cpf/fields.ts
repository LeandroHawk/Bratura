import { z } from 'zod';
import { validationMessage } from '../../code/validation-message/validation-message';

function checkDigit(digits: string) {
  const weightOfFirst = digits.length + 1;
  const sum = [...digits].reduce(
    (total, digit, index) => total + Number(digit) * (weightOfFirst - index),
    0,
  );
  return ((sum * 10) % 11) % 10;
}

/** Receita Federal's rule: 11 digits, the last two computed from the others, not all the same. */
function isCpf(value: string) {
  if (!/^\d{11}$/.test(value) || /^(\d)\1{10}$/.test(value)) return false;
  return (
    checkDigit(value.slice(0, 9)) === Number(value[9]) &&
    checkDigit(value.slice(0, 10)) === Number(value[10])
  );
}

/** A person's CPF, digits only (`52998224725`): the form drops the dots and the dash. */
export const requiredCpf = z.string().refine(isCpf, validationMessage('cpf'));
