import { z } from 'zod';
import { nullableString, requiredString } from '../../../../../primitives/code/string/fields';
import { UfEnum } from '../../../../../primitives/external/uf/enum';
import { CallNoticeExtractionSchema } from '../../../../call-notice-extraction/entity';
import { CallNoticeSchema } from '../../../entity';
import { CallNoticeDeadlineEnum } from '../../../fragments/registration-window/fields';

/** How a call reaches creators, as the overview filters it. */
export const OpportunityKindEnum = z.enum([
  'publicCall',
  'privateCall',
  'festival',
  'culturalFair',
  'contestOrAward',
]);
export type OpportunityKind = z.infer<typeof OpportunityKindEnum>;

/** How far a call reaches: one city, one state, a region, the country. */
export const CallNoticeCoverageEnum = z.enum(['municipal', 'state', 'regional', 'national']);
export type CallNoticeCoverage = z.infer<typeof CallNoticeCoverageEnum>;

/**
 * One call notice as the site lists and details it: what the source published, what extraction
 * proved (each value with its quote) and where the deadline stands. Every value a source may not
 * give is `null`, shown as "não informado", never filled in.
 */
export const CallNoticeOverviewItemSchema = z.object({
  /** The row's id; a plain string here so a list can key and link by it. */
  callNoticeId: requiredString('short'),
  ...CallNoticeSchema.pick({
    title: true,
    summary: true,
    officialUrl: true,
    documentUrls: true,
    registrationOpens: true,
    registrationCloses: true,
    firstSeenAt: true,
    lastSeenAt: true,
  }).shape,
  /** `callNoticeDeadline` on the server's clock. */
  deadline: CallNoticeDeadlineEnum,
  /** Open, with the close a few days away: the server decides how few. */
  closesSoon: z.boolean(),
  /** `null` while the call's documents were not read. */
  extraction: CallNoticeExtractionSchema.pick({
    amountsPerProject: true,
    totalBudget: true,
    applicantTypes: true,
    residenceRequirement: true,
    artForms: true,
    requiredDocuments: true,
    evaluationCriteria: true,
  }).nullable(),
  // Asked for by the screens and not extracted today: `null` until a source or extraction gives
  // them.
  organizer: nullableString('medium'),
  opportunityKind: OpportunityKindEnum.nullable(),
  coverage: CallNoticeCoverageEnum.nullable(),
  state: UfEnum.nullable(),
  city: nullableString('short'),
});

export type CallNoticeOverviewItem = z.infer<typeof CallNoticeOverviewItemSchema>;

export const CallNoticeOverviewQueryFromBraturaPortalReturnsSchema = z.array(
  CallNoticeOverviewItemSchema,
);
