import { z } from 'zod';
import { validationMessage } from '../../code/validation-message/validation-message';

/** A Correios postal code, digits only (`60060440`): the form drops the dash. */
export const requiredCep = z
  .string()
  .refine((value) => /^\d{8}$/.test(value), validationMessage('cep'));
