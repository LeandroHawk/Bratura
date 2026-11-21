import { z } from 'zod';
import { requiredString } from '../../../../../primitives/code/string/fields';
import { requiredInstant } from '../../../../../primitives/code/time/instant/fields';
import { PortfolioDocumentKindEnum } from '../../../../portfolio-item/enums/document-kind/enum';
import { CallNoticeOverviewItemSchema } from '../call-notice-overview/query';

/** The answer a creator gets for one call: can apply, can apply once gaps close, cannot. */
export const MatchClassificationEnum = z.enum(['eligible', 'almostEligible', 'notEligible']);
export type MatchClassification = z.infer<typeof MatchClassificationEnum>;

/** `needsConfirmation`: the rule is written in words only a person can check (a residence). */
export const MatchRequirementStatusEnum = z.enum(['met', 'notMet', 'needsConfirmation']);
export type MatchRequirementStatus = z.infer<typeof MatchRequirementStatusEnum>;

export const MatchRequirementKindEnum = z.enum([
  'applicantType',
  'artForm',
  'residence',
  'document',
]);
export type MatchRequirementKind = z.infer<typeof MatchRequirementKindEnum>;

/**
 * One thing a call asks, checked against the portfolio by objective rules in the backend. The web
 * writes the sentence from these values; the quote is the call's own text, the proof.
 */
export const MatchRequirementSchema = z.object({
  kind: MatchRequirementKindEnum,
  status: MatchRequirementStatusEnum,
  /** What the call asks, in its own words or values ("CCMEI", "residir no Ceará há 2 anos"). */
  asked: requiredString('long'),
  quote: requiredString('long'),
  /** For a document: the portfolio kind that answers it, when the wording names one. */
  documentKind: PortfolioDocumentKindEnum.nullable(),
});
export type MatchRequirement = z.infer<typeof MatchRequirementSchema>;

/** How one call fits one creator (`matches`, `docs/plan.md`): computed, never typed by anyone. */
export const CallNoticeMatchSchema = z.object({
  classification: MatchClassificationEnum,
  requirements: z.array(MatchRequirementSchema),
  analyzedAt: requiredInstant,
});
export type CallNoticeMatch = z.infer<typeof CallNoticeMatchSchema>;

/** A call with its fit; `match` is `null` when the call was not read or nobody is signed in. */
export const CallNoticeWithMatchSchema = CallNoticeOverviewItemSchema.extend({
  match: CallNoticeMatchSchema.nullable(),
});
export type CallNoticeWithMatch = z.infer<typeof CallNoticeWithMatchSchema>;

export const EligibleCallNoticesQueryFromBraturaPortalReturnsSchema =
  z.array(CallNoticeWithMatchSchema);
