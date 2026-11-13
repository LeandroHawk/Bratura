import { z } from 'zod';
import { ZonedInstantSchema } from '../../../../primitives/code/time/zoned-instant/fields';

/**
 * Writes: `recordCallNotice`. Comes from: the listing [Mapas `registrationFrom`, `registrationTo`].
 * When applications open and close, as published; `null` when the source does not say.
 */
export const CallNoticeRegistrationWindowFields = z.object({
  registrationOpens: ZonedInstantSchema.nullable(),
  registrationCloses: ZonedInstantSchema.nullable(),
});

type RegistrationWindow = z.infer<typeof CallNoticeRegistrationWindowFields>;

/**
 * Refuses a window that closes before it opens, when the source gives both ends: wrong data is
 * rejected instead of showing a creator an impossible deadline. Attach it last, to the schema that
 * parses: Zod 4 throws on `.pick`/`.omit`/`.partial` of a refined object.
 */
export function withOrderedRegistrationWindow<Schema extends z.ZodType<RegistrationWindow>>(
  schema: Schema,
) {
  return schema.refine(
    ({ registrationOpens, registrationCloses }) =>
      registrationOpens === null ||
      registrationCloses === null ||
      registrationCloses.at >= registrationOpens.at,
    { path: ['registrationCloses'] },
  );
}
