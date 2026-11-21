import { z } from 'zod';
import { requiredAmountInCents } from '../../primitives/domain/money/fields';
import { requiredSha256Hex } from '../../primitives/code/hash/fields';
import { documentId } from '../../primitives/code/id/fields';
import { requiredString } from '../../primitives/code/string/fields';
import { requiredInstant } from '../../primitives/code/time/instant/fields';
import { EligibilityRuleKindEnum } from '../call-notice/enums/eligibility-rule/enum';
import { QuotaGroupEnum } from '../call-notice/enums/quota-group/enum';
import { RequirementKindEnum, RequirementStageEnum } from '../call-notice/enums/requirement/enum';

/** Who may apply, as call notices name them (pessoa física, MEI, empresa, coletivo, OSC). */
export const ApplicantTypeEnum = z.enum([
  'individual',
  'mei',
  'company',
  'collectiveWithoutCnpj',
  'nonprofit',
]);
export type ApplicantType = z.infer<typeof ApplicantTypeEnum>;

/** The artistic languages a call covers (draft list, from the PNAB segments); `any` for all. */
export const ArtFormEnum = z.enum([
  'any',
  'music',
  'theatre',
  'dance',
  'circus',
  'visualArts',
  'audiovisual',
  'literature',
  'crafts',
  'popularCultures',
  'heritage',
  'photography',
  'design',
  'fashion',
  'digitalCulture',
]);
export type ArtForm = z.infer<typeof ArtFormEnum>;

/**
 * The passage of the call notice's own text that proves a value: always source text, never the
 * model's (`docs/security.md` §3). A value without one is not stored.
 */
const quote = requiredString('long');
const label = requiredString('long');

/**
 * Writes: `extraction.ts`, by hand (`extractPendingCallNotices`). Comes from: the call notice's
 * read documents through `model/llm/`, each value checked against its quote. Reads: matching.
 */
export const CallNoticeExtractionSchema = z.object({
  callNoticeId: documentId('callNotices'),
  /**
   * The `markdownHash` of each document read for it, sorted, and the prompt's version: extraction
   * runs again only when a document or the prompt changes.
   */
  documentHashes: z.array(requiredSha256Hex).min(1),
  promptVersion: z.int().positive(),
  extractedAt: requiredInstant,
  /** The model that read it (`LLM_MODEL`), so an extraction can be traced and redone. */
  model: requiredString('short'),
  /** Values the checks refused (quote not in the text, or a number or date not in its quote). */
  valuesRefused: z.int().nonnegative(),

  /** A call for artists and groups with their own project, or noise (reviewers, registries). */
  isCreatorCall: z.object({ value: z.boolean(), quote }).nullable(),
  amountsPerProject: z.array(
    z.object({ category: label, amountInCents: requiredAmountInCents, quote }),
  ),
  totalBudget: z.object({ amountInCents: requiredAmountInCents, quote }).nullable(),
  applicantTypes: z.object({ value: z.array(ApplicantTypeEnum).min(1), quote }).nullable(),
  /** Where applicants must live or work, as the quote writes it. */
  residenceRequirement: z.object({ value: label, quote }).nullable(),
  artForms: z.array(z.object({ value: ArtFormEnum, quote })),
  /**
   * Each document or proof the call asks, one per document: `appliesTo` null when everyone is
   * asked, `stage` null when the notice does not say when.
   */
  requirements: z.array(
    z.object({
      kind: RequirementKindEnum,
      detail: label,
      appliesTo: z.array(ApplicantTypeEnum).min(1).nullable(),
      stage: RequirementStageEnum.nullable(),
      quote,
    }),
  ),
  /** Rules on who or what may apply that are not documents (age, residence time, impediments). */
  eligibilityRules: z.array(z.object({ kind: EligibilityRuleKindEnum, detail: label, quote })),
  /** Places or money reserved for a group; `share` as the quote writes it ("20%", "3 vagas"). */
  quotas: z.array(
    z.object({ group: QuotaGroupEnum, share: requiredString('short').nullable(), quote }),
  ),
  evaluationCriteria: z.array(
    z.object({ criterion: label, maxPoints: z.number().nonnegative().nullable(), quote }),
  ),
  /** The last day to apply as the text writes it; Mapas's own date wins, this one flags a gap. */
  registrationCloses: z.object({ date: z.iso.date(), quote }).nullable(),
});

export type CallNoticeExtraction = z.infer<typeof CallNoticeExtractionSchema>;
