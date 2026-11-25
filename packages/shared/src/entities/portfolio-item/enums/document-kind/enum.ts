import type { z } from 'zod';
import { RequirementKindEnum } from '../../../call-notice/enums/requirement/enum';

/**
 * The papers a creator keeps, named by what a call asks for (`RequirementKindEnum`), so matching
 * compares equal values instead of reading a description. The organization's kinds
 * (`organizationRecords`, `groupRepresentation`) wait for organization profiles.
 */
export const PortfolioDocumentKindEnum = RequirementKindEnum.extract([
  'identity',
  'proofOfResidence',
  'cnpjOrMei',
  'taxAndLaborClearance',
  'bankAccount',
  'portfolioOrActivityProof',
  'curriculum',
  'artisanCredential',
  'other',
]);

export type PortfolioDocumentKind = z.infer<typeof PortfolioDocumentKindEnum>;
