import { z } from 'zod';
import { nullableString, requiredString } from '../../primitives/code/string/fields';
import { requiredInstant } from '../../primitives/code/time/instant/fields';

/**
 * A person signed in: the row is created on first login from the JWT alone (`users:store`,
 * `docs/security.md` §1) — `tokenIdentifier` is the issuer+subject the provider signs,
 * `name`/`email` whatever the token carries (WorkOS may send none). Writes: `users.ts`;
 * referenced by `userNotifications`, `notificationDeliveries` and `userMessageChannels`.
 */
export const UserSchema = z.object({
  /** The signed identity the row belongs to; `users` is indexed on it (`by_token`). */
  tokenIdentifier: requiredString('medium'),
  name: nullableString('medium'),
  email: nullableString('medium'),
  /** When the row was created; `_creationTime` already says it, kept for the reads to come. */
  createdAt: requiredInstant,
});

export type User = z.infer<typeof UserSchema>;
