import { z } from 'zod';

/**
 * Writes: the team, in the backend's `model/sources/registry.ts`. Comes from: a fetch timing out
 * from Convex (US East) while the site answers from Brazil (Pernambuco, Sergipe, Ponta Grossa).
 */
export const SourceAccessFields = z.object({
  /**
   * Its listing and documents are read through Firecrawl from Brazil, never fetched by our
   * backend directly; absent on a source that answers from anywhere.
   */
  answersOnlyFromBrazil: z.boolean().optional(),
});
