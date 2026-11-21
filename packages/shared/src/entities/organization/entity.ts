import { z } from 'zod';
import { requiredSlug, requiredString } from '../../primitives/code/string/fields';
import { requiredInstant } from '../../primitives/code/time/instant/fields';

/**
 * Who pays for the panel and follows creators: an association, cooperative, producer or culture
 * department (`docs/product.md`, Who pays). Its members are `memberships`; its billing is
 * `billingSubscriptions`. Writes: `organizations.ts`.
 */
export const OrganizationSchema = z.object({
  /** The organization's name in code, seeds and ops commands (`demo-assoc`): a natural key. */
  slug: requiredSlug,
  /** How the team and the panel call it ("Associação das Artesãs de Canindé"). */
  name: requiredString(),
  /** When the row was created. */
  createdAt: requiredInstant,
});

export type Organization = z.infer<typeof OrganizationSchema>;
