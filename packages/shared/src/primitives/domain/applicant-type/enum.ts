import { z } from 'zod';

/**
 * Who applies to a call, as call notices name them (pessoa física, MEI, empresa, coletivo, OSC):
 * what a call accepts and what a creator's account stands for, so matching compares equal values.
 */
export const ApplicantTypeEnum = z.enum([
  'individual',
  'mei',
  'company',
  'collectiveWithoutCnpj',
  'nonprofit',
]);
export type ApplicantType = z.infer<typeof ApplicantTypeEnum>;
