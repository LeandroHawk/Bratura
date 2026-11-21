import { z } from 'zod';
import { requiredString } from '../../../../primitives/code/string/fields';
import { PortfolioDocumentKindEnum } from '../../enums/document-kind/enum';
import { AttachedFileSchema } from '../../../../primitives/domain/attached-file/fields';
import { PortfolioItemIdentityFields } from '../../fragments/identity/fields';

/**
 * Writes: the creator, through the portfolio screen. A paper a call may ask for. Matching reads
 * `documentKind` and `validUntil` to say what is ready and what is missing.
 */
export const DocumentPortfolioItemSchema = z.object({
  kind: z.literal('document'),
  ...PortfolioItemIdentityFields.shape,
  documentKind: PortfolioDocumentKindEnum,
  /** How the creator names it ("CCMEI 2026", "Conta de luz de março"). */
  description: requiredString(),
  /** The registry's number, for the kinds that have one (CNPJ, SICAB). */
  issuedOn: z.iso.date().nullable(),
  /** `null` for a paper that does not expire. */
  validUntil: z.iso.date().nullable(),
  /** The scanned file; `null` while the creator only listed the paper. */
  file: AttachedFileSchema.nullable(),
});

export type DocumentPortfolioItem = z.infer<typeof DocumentPortfolioItemSchema>;

export const PortfolioDocumentStatusEnum = z.enum(['registered', 'pending', 'expired']);
export type PortfolioDocumentStatus = z.infer<typeof PortfolioDocumentStatusEnum>;

/**
 * Where a paper stands on `today` (`YYYY-MM-DD`, read in São Paulo): `expired` past its validity,
 * `pending` while no file was sent, `registered` otherwise. Derived, never stored.
 */
export function portfolioDocumentStatus(
  { validUntil, file }: Pick<DocumentPortfolioItem, 'validUntil' | 'file'>,
  today: string,
): PortfolioDocumentStatus {
  if (validUntil !== null && validUntil < today) return 'expired';
  return file === null ? 'pending' : 'registered';
}
