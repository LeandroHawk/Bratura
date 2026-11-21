import { z } from 'zod';
import { requiredInstant } from '../../primitives/code/time/instant/fields';

/**
 * A person signed in: today the row carries only its creation — WorkOS supplies the identity
 * when login lands (email, name, the WorkOS id all arrive then, `docs/plan.md`). Writes:
 * `users.ts`; referenced by `userNotifications`, `notificationDeliveries` and
 * `userMessageChannels`.
 */
export const UserSchema = z.object({
  /** When the row was created; `_creationTime` already says it, kept for the reads to come. */
  createdAt: requiredInstant,
});

export type User = z.infer<typeof UserSchema>;
