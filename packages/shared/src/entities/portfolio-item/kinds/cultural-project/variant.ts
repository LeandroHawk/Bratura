import { z } from 'zod';
import { nullableString, requiredString } from '../../../../primitives/code/string/fields';
import { requiredAmountInCents } from '../../../../primitives/domain/money/fields';
import { CulturalAreaEnum } from '../../../creator/enums/cultural-area/enum';
import { CulturalProjectStatusEnum } from '../../enums/project-status/enum';
import { PortfolioItemMediaFields } from '../../fragments/media/fields';
import { PortfolioItemIdentityFields } from '../../fragments/identity/fields';
import { PortfolioItemPeriodFields } from '../../fragments/period/fields';

/** How many people a project's team lists. */
export const culturalProjectTeamMax = 30;

/** One person of a project's team, as a call's "ficha técnica" asks: who, doing what. */
export const CulturalProjectTeamMemberSchema = z.object({
  name: requiredString('medium'),
  role: requiredString('medium'),
});

/**
 * Writes: the creator, through the portfolio screen. A project of their own, planned, running or
 * done: what a call's "describe your project" is answered from.
 */
export const CulturalProjectPortfolioItemSchema = z.object({
  kind: z.literal('culturalProject'),
  ...PortfolioItemIdentityFields.shape,
  ...PortfolioItemPeriodFields.shape,
  ...PortfolioItemMediaFields.shape,
  name: requiredString(),
  culturalArea: CulturalAreaEnum,
  description: nullableString(),
  objective: nullableString(),
  status: CulturalProjectStatusEnum,
  venue: nullableString('medium'),
  targetAudience: nullableString('long'),
  results: nullableString(),
  /** What the project costs as a whole; `null` while not budgeted. */
  budgetInCents: requiredAmountInCents.nullable(),
  team: z.array(CulturalProjectTeamMemberSchema).max(culturalProjectTeamMax),
});

export type CulturalProjectPortfolioItem = z.infer<typeof CulturalProjectPortfolioItemSchema>;
