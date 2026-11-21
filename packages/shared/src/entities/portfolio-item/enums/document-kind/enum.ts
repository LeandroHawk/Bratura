import { z } from 'zod';

/**
 * The papers call notices ask for: CPF, CNPJ, the MEI certificate (CCMEI), the artisan registry
 * (SICAB), proof of residence, proof of cultural experience, certificates, declarations.
 */
export const PortfolioDocumentKindEnum = z.enum([
  'cpf',
  'cnpj',
  'ccmei',
  'sicab',
  'proofOfResidence',
  'proofOfCulturalExperience',
  'certificate',
  'declaration',
  'other',
]);

export type PortfolioDocumentKind = z.infer<typeof PortfolioDocumentKindEnum>;
