import type { GenericId } from 'convex/values';
import type { Doc } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { appError } from './appError';

// Who calls: the `users` row for the signed identity. `docs/security.md` §1 — the owner comes
// from authentication, never from the args, and every read or write of an owned document checks
// it through the helpers below.

/**
 * The signed-in user's row, or `unauthenticated` when there is no valid identity or no row yet
 * (the front runs `users:store` on first login before calling anything private).
 */
export const requireUser = async (ctx: QueryCtx | MutationCtx): Promise<Doc<'users'>> => {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) throw appError({ code: 'unauthenticated' });
  const user = await ctx.db
    .query('users')
    .withIndex('by_token', (index) => index.eq('tokenIdentifier', identity.tokenIdentifier))
    .unique();
  if (user === null) throw appError({ code: 'unauthenticated' });
  return user;
};

/**
 * Fails `forbidden` when the document's `userId` is not the caller's — the only comparison
 * allowed, so a new function cannot inline a different (or forgotten) check.
 */
export const assertUserOwns = <Row extends { userId: GenericId<'users'> }>(
  doc: Row,
  user: Doc<'users'>,
) => {
  if (doc.userId !== user._id) throw appError({ code: 'forbidden' });
};
