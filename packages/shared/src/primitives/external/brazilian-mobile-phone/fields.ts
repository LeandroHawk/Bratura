import { z } from 'zod';
import { validationMessage } from '../../code/validation-message/validation-message';

/**
 * A Brazilian mobile number as Anatel numbers it, digits only: the two-digit area code, then nine
 * digits starting with 9 (`85987654321`). No country code: WhatsApp's client adds it.
 */
export const requiredBrazilianMobilePhone = z
  .string()
  .refine((value) => /^[1-9]\d9\d{8}$/.test(value), validationMessage('brazilianMobilePhone'));
