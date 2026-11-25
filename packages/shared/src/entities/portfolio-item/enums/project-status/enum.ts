import { z } from 'zod';

/** Where a cultural project stands, as the creator says. */
export const CulturalProjectStatusEnum = z.enum(['planned', 'inProgress', 'completed']);

export type CulturalProjectStatus = z.infer<typeof CulturalProjectStatusEnum>;
