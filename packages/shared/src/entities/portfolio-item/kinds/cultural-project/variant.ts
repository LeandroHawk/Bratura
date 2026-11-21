import { z } from 'zod';
import { nullableString, requiredString } from '../../../../primitives/code/string/fields';
import { CulturalAreaEnum } from '../../../creator/enums/cultural-area/enum';
import { CulturalProjectStatusEnum } from '../../enums/project-status/enum';
import { PortfolioItemMediaFields } from '../../fragments/media/fields';
import { PortfolioItemIdentityFields } from '../../fragments/identity/fields';
import { PortfolioItemPeriodFields } from '../../fragments/period/fields';

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
});

export type CulturalProjectPortfolioItem = z.infer<typeof CulturalProjectPortfolioItemSchema>;
