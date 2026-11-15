import { z } from 'zod';
import { ArtFormEnum } from '../../../call-notice-extraction/entity';

/**
 * The area a creator works in: the art forms a call notice names (so matching compares equal
 * values), without `any`, which only a call can say, plus `other` for work outside the list.
 */
export const CulturalAreaEnum = z.enum([...ArtFormEnum.exclude(['any']).options, 'other']);

export type CulturalArea = z.infer<typeof CulturalAreaEnum>;
