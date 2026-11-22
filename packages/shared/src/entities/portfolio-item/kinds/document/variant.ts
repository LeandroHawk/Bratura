import { z } from 'zod';
import { plainDateDaysAfter } from '../../../../primitives/code/calendar/calendar';
import { requiredString } from '../../../../primitives/code/string/fields';
import { validationMessage } from '../../../../primitives/code/validation-message/validation-message';
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
  issuedOn: z.iso.date().nullable(),
  /** `null` for a paper that does not expire. */
  validUntil: z.iso.date().nullable(),
  /** The scanned file; `null` while the creator only listed the paper. */
  file: AttachedFileSchema.nullable(),
});

export type DocumentPortfolioItem = z.infer<typeof DocumentPortfolioItemSchema>;

/**
 * Refuses a tax and labor clearance with no validity: every one expires, and a call reads the
 * date. Attach it last, to the schema that parses (Zod 4 throws on `.pick` of a refined object).
 */
export function withClearanceValidity<
  Schema extends z.ZodType<Pick<DocumentPortfolioItem, 'documentKind' | 'validUntil'>>,
>(schema: Schema) {
  return schema.refine(
    ({ documentKind, validUntil }) =>
      documentKind !== 'taxAndLaborClearance' || validUntil !== null,
    { path: ['validUntil'], ...validationMessage('clearanceWithoutValidity') },
  );
}

export const PortfolioDocumentStatusEnum = z.enum(['registered', 'expiring', 'pending', 'expired']);
export type PortfolioDocumentStatus = z.infer<typeof PortfolioDocumentStatusEnum>;

/** A paper whose validity ends within this many days reads "expiring". */
export const portfolioDocumentExpiringWithinDays = 30;

/**
 * Where a paper stands on `today` (`YYYY-MM-DD`, read in São Paulo): `expired` past its validity,
 * `pending` while no file was sent, `expiring` in its last days, `registered` otherwise. Derived,
 * never stored.
 */
export function portfolioDocumentStatus(
  { validUntil, file }: Pick<DocumentPortfolioItem, 'validUntil' | 'file'>,
  today: string,
): PortfolioDocumentStatus {
  if (validUntil !== null && validUntil < today) return 'expired';
  if (file === null) return 'pending';
  const expiresSoon =
    validUntil !== null &&
    validUntil <= plainDateDaysAfter({ date: today, days: portfolioDocumentExpiringWithinDays });
  return expiresSoon ? 'expiring' : 'registered';
}
