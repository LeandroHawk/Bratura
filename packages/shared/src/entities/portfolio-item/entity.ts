import { z } from 'zod';
import { CulturalExperiencePortfolioItemSchema } from './kinds/cultural-experience/variant';
import { CulturalProjectPortfolioItemSchema } from './kinds/cultural-project/variant';
import { DocumentPortfolioItemSchema } from './kinds/document/variant';

/**
 * A piece of a creator's portfolio (`portfolioItems`, `docs/plan.md`). Each kind carries its own
 * fields, so the entity is one variant per kind (`kinds/`); every kind shares the client-made key
 * (`fragments/identity`).
 */
export const PortfolioItemSchema = z.discriminatedUnion('kind', [
  CulturalExperiencePortfolioItemSchema,
  CulturalProjectPortfolioItemSchema,
  DocumentPortfolioItemSchema,
]);

export type PortfolioItem = z.infer<typeof PortfolioItemSchema>;
export type PortfolioItemKind = PortfolioItem['kind'];

/** Bounds the browser demo and the profile sent to a public matching query. */
export const portfolioItemsMax = 100;
