import { z } from 'zod';

/** Who a call reserves places or money for; `black` covers "pessoas negras (pretas e pardas)". */
export const QuotaGroupEnum = z.enum([
  'black',
  'indigenous',
  'quilombola',
  'traditionalPeoples',
  'disabled',
  'women',
  'lgbtqia',
  'elderly',
  'youth',
  'other',
]);
export type QuotaGroup = z.infer<typeof QuotaGroupEnum>;
