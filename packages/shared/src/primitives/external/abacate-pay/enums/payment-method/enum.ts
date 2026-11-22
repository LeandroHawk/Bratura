import { z } from 'zod';

/**
 * How the organization is charged each cycle: a saved credit card or Pix Automático (the
 * provider's own vocabulary, kept as it comes so a webhook needs no translation).
 */
export const PaymentMethodEnum = z.enum(['CARD', 'PIX']);

export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;
