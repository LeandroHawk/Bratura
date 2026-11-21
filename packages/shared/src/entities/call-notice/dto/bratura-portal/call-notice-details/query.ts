import { z } from 'zod';
import { CallNoticeExtractionSchema } from '../../../../call-notice-extraction/entity';
import {
  MatchCheckStatusEnum,
  MatchPaperValidityEnum,
} from '../../../../match/enums/check-status/enum';
import { CallNoticeSchema } from '../../../entity';
import { CallNoticeCardSchema } from '../call-notice-cards/query';

const extraction = CallNoticeExtractionSchema.shape;

/** One document or proof the call asks from this profile's applicant type, and how it stands. */
export const MatchRequirementCheckSchema = extraction.requirements.element
  .omit({ appliesTo: true })
  .extend({
    status: MatchCheckStatusEnum,
    /** For a paper the portfolio holds: how its validity stands; `null` otherwise. */
    paperValidity: MatchPaperValidityEnum.nullable(),
  });
export type MatchRequirementCheck = z.infer<typeof MatchRequirementCheckSchema>;

export const MatchEligibilityRuleCheckSchema = extraction.eligibilityRules.element.extend({
  status: MatchCheckStatusEnum,
});
export type MatchEligibilityRuleCheck = z.infer<typeof MatchEligibilityRuleCheckSchema>;

/**
 * How one call fits the profile, item by item: computed in the backend by objective rules, each
 * item with the call's own text as proof. A `null` check: the call does not state that rule.
 */
export const CallNoticeMatchChecksSchema = z.object({
  /** `met` when the call lists the profile's applicant type; a list may be incomplete. */
  applicantType: extraction.applicantTypes
    .unwrap()
    .extend({ status: MatchCheckStatusEnum })
    .nullable(),
  /** One status for the call's art forms against the profile's cultural areas. */
  artFormStatus: MatchCheckStatusEnum.nullable(),
  requirements: z.array(MatchRequirementCheckSchema),
  eligibilityRules: z.array(MatchEligibilityRuleCheckSchema),
});
export type CallNoticeMatchChecks = z.infer<typeof CallNoticeMatchChecksSchema>;

/**
 * One call with everything its details show. `extraction` is `null` while its documents were not
 * read (a source that forbids automated reading never is): the screen then shows the official
 * link alone. Every value a source may not give is `null`, shown as "não informado".
 */
export const CallNoticeDetailsSchema = CallNoticeCardSchema.omit({ classification: true }).extend({
  ...CallNoticeSchema.pick({
    summary: true,
    documentUrls: true,
    documentLabels: true,
    resultPosted: true,
    lastSeenAt: true,
  }).shape,
  extraction: CallNoticeExtractionSchema.pick({
    isCreatorCall: true,
    amountsPerProject: true,
    totalBudget: true,
    applicantTypes: true,
    residenceRequirement: true,
    artForms: true,
    requirements: true,
    eligibilityRules: true,
    quotas: true,
    evaluationCriteria: true,
    extractedAt: true,
  }).nullable(),
  /** `null` with a `null` extraction, or for a call that is not for creators. */
  classification: CallNoticeCardSchema.shape.classification.nullable(),
  matchChecks: CallNoticeMatchChecksSchema.nullable(),
});
export type CallNoticeDetails = z.infer<typeof CallNoticeDetailsSchema>;

export const CallNoticeDetailsQueryFromBraturaPortalArgsSchema = z.object({
  callNoticeId: CallNoticeCardSchema.shape.callNoticeId,
});

export const CallNoticeDetailsQueryFromBraturaPortalReturnsSchema = CallNoticeDetailsSchema;
