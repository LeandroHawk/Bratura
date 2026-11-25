import { z } from 'zod';
import { CreatorSchema, type Creator } from '../creator/entity';
import { type PortfolioItem, portfolioItemsMax } from '../portfolio-item/entity';
import { CulturalExperiencePortfolioItemSchema } from '../portfolio-item/kinds/cultural-experience/variant';
import { DocumentPortfolioItemSchema } from '../portfolio-item/kinds/document/variant';

/** Only the facts matching reads: no identity, descriptions, links or uploaded file metadata. */
export const MatchProfileSchema = z.object({
  creator: CreatorSchema.pick({
    applicantType: true,
    state: true,
    city: true,
    mainCulturalArea: true,
    secondaryCulturalAreas: true,
    birthDate: true,
    livesInCurrentPlaceSince: true,
    isPublicServant: true,
    activityStartYear: true,
  }),
  portfolioItems: z
    .array(
      z.discriminatedUnion('kind', [
        DocumentPortfolioItemSchema.pick({
          kind: true,
          documentKind: true,
          validUntil: true,
        }).extend({ hasFile: z.boolean() }),
        CulturalExperiencePortfolioItemSchema.pick({ kind: true }).extend({
          hasProof: z.boolean(),
        }),
      ]),
    )
    .max(portfolioItemsMax),
});

export type MatchProfile = z.infer<typeof MatchProfileSchema>;

/** Both callers strip private portfolio content before it crosses the public query boundary. */
export function matchProfileFromPortfolio(
  creator: Creator,
  portfolioItems: PortfolioItem[],
): MatchProfile {
  return MatchProfileSchema.parse({
    creator,
    portfolioItems: portfolioItems
      .slice(0, portfolioItemsMax)
      .flatMap((item): MatchProfile['portfolioItems'] => {
        if (item.kind === 'document')
          return [
            {
              kind: item.kind,
              documentKind: item.documentKind,
              validUntil: item.validUntil,
              hasFile: item.file !== null,
            },
          ];
        if (item.kind === 'culturalExperience')
          return [
            {
              kind: item.kind,
              hasProof: item.attachments.length > 0 || item.links.length > 0,
            },
          ];
        return [];
      }),
  });
}
