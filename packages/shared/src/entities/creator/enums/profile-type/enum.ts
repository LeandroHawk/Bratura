import { z } from 'zod';

/**
 * Who the account stands for, as the sign-up asks: a person, an organization with or without
 * profit, a group without a CNPJ, a rights council, a public body. Matching reads it against a
 * call's `applicantTypes`.
 */
export const CreatorProfileTypeEnum = z.enum([
  'individual',
  'nonprofitLegalEntity',
  'forProfitLegalEntity',
  'informalGroup',
  'rightsCouncil',
  'publicOrganization',
]);

export type CreatorProfileType = z.infer<typeof CreatorProfileTypeEnum>;
