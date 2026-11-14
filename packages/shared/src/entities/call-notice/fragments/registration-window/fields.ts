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

/**
 * A close past this is no deadline: Mapas writes `2111-01-01` for an open-ended form (also seen:
 * 2050, 2052, 2076, 2100).
 */
export const openEndedRegistrationAfterMs = 365 * 24 * 60 * 60 * 1000;

export const CallNoticeDeadlineEnum = z.enum(['open', 'closed', 'openEnded', 'notInformed']);
export type CallNoticeDeadline = z.infer<typeof CallNoticeDeadlineEnum>;

/**
 * Where a call's deadline stands: `open` (a real close still ahead), `closed`, `openEnded` (a close
 * so far ahead it means none), `notInformed` (the source gives none). Never show an `openEnded`
 * close as a date: "até 01/01/2111" is the sentinel, not a deadline.
 */
export function callNoticeDeadline(
  { registrationCloses }: Pick<RegistrationWindow, 'registrationCloses'>,
  now: number,
): CallNoticeDeadline {
  if (registrationCloses === null) return 'notInformed';
  if (registrationCloses.at < now) return 'closed';
  if (registrationCloses.at > now + openEndedRegistrationAfterMs) return 'openEnded';
  return 'open';
}
