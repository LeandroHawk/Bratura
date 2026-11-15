import { z } from 'zod';
import { nullableString, requiredString } from '../../../../primitives/code/string/fields';
import { requiredHttpUrl } from '../../../../primitives/code/url/fields';
import { UfEnum } from '../../../../primitives/external/uf/enum';
import { CulturalActivityKindEnum } from '../../enums/activity-kind/enum';
import { PortfolioAttachmentSchema, portfolioItemListMax } from '../../fragments/attachment/fields';
import { PortfolioItemIdentityFields } from '../../fragments/identity/fields';
import { PortfolioItemPeriodFields } from '../../fragments/period/fields';

/**
 * Writes: the creator, through the portfolio screen. Something they did: a show, a fair, a class.
 * What proves the years of activity a call asks for.
 */
export const CulturalExperiencePortfolioItemSchema = z.object({
  kind: z.literal('culturalExperience'),
  ...PortfolioItemIdentityFields.shape,
  ...PortfolioItemPeriodFields.shape,
  title: requiredString(),
  activityKind: CulturalActivityKindEnum,
  description: nullableString(),
  venue: nullableString('medium'),
  city: nullableString('short'),
  state: UfEnum.nullable(),
  /** The institution or organization that ran it. */
  organizer: nullableString('medium'),
  /** Videos and pages about it. */
  links: z.array(requiredHttpUrl).max(portfolioItemListMax),
  /** Photos, audios and proofs (a certificate, a contract, a press clipping). */
  attachments: z.array(PortfolioAttachmentSchema).max(portfolioItemListMax),
});

export type CulturalExperiencePortfolioItem = z.infer<typeof CulturalExperiencePortfolioItemSchema>;
