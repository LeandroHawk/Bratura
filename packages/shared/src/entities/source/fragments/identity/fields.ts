import { z } from 'zod';
import { requiredSlug, requiredString } from '../../../../primitives/code/string/fields';

/**
 * Writes: the team, in the backend's `model/sources/registry.ts`. Comes from: their own naming.
 * What names a source for people, whatever its kind.
 */
export const SourceIdentityFields = z.object({
  /** The source's name in code, seeds and logs (`mapas-federal`): the same in every deployment. */
  slug: requiredSlug,
  /** How the team and the admin screens call it ("Mapas Culturais — Federal"). */
  name: requiredString(),
  /** Off: ingestion skips it (a site that stopped answering, a source under review). */
  isActive: z.boolean(),
});
