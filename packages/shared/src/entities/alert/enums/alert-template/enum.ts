import { z } from 'zod';

/**
 * The message templates the team submits to Meta through Nvoip (`docs/integrations/whatsapp.md`).
 * The value is the template's name there, so it is also what a send tells Nvoip to use.
 */
export const AlertTemplateEnum = z.enum([
  'edital_compativel',
  'quase_elegivel',
  'prazo_chegando',
  'edital_retificado',
]);

export type AlertTemplate = z.infer<typeof AlertTemplateEnum>;
