import { z } from 'zod';

/** What a cultural experience was: a show, an exhibition, a fair, a class. */
export const CulturalActivityKindEnum = z.enum([
  'presentation',
  'exhibition',
  'fair',
  'festival',
  'workshop',
  'course',
  'culturalEvent',
  'other',
]);

export type CulturalActivityKind = z.infer<typeof CulturalActivityKindEnum>;
