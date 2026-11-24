import { z } from 'zod';
import { UserSchema } from '@bratura/shared/entities/user/entity';
import { documentId } from '@bratura/shared/primitives/code/id/fields';
import { requiredInstant } from '@bratura/shared/primitives/code/time/instant/fields';
import { appError } from './lib/appError';
import { internalZodMutation, publicZodMutation, userZodQuery } from './lib/builders';

// `users`: who the rows belong to. The row is created by `store` on first login, from the JWT
// alone — the tokenIdentifier is the dedupe key (`by_token`), so a repeat sign-in returns the
// same row. The only writer.

const StoreMutationArgsSchema = z.object({});
const StoreMutationReturnsSchema = documentId('users');

/**
 * Find-or-create the caller's `users` row from the JWT (tokenIdentifier, name, email). No
 * provider webhook: nothing we keep lives outside the token, so a second round-trip would only
 * move the same data. Throws `unauthenticated` when nobody is signed in.
 */
export const store = publicZodMutation({
  args: StoreMutationArgsSchema,
  returns: StoreMutationReturnsSchema,
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) throw appError({ code: 'unauthenticated' });
    const known = await ctx.db
      .query('users')
      .withIndex('by_token', (index) => index.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();
    if (known !== null) return known._id;
    return await ctx.db.insert('users', {
      tokenIdentifier: identity.tokenIdentifier,
      name: identity.name ?? null,
      email: identity.email ?? null,
      createdAt: Date.now(),
    });
  },
});

const CurrentUserQueryArgsSchema = z.object({});
const CurrentUserQueryReturnsSchema = UserSchema;

/** The caller's row, for the web to know who is signed in; `unauthenticated` signed out. */
export const currentUser = userZodQuery({
  args: CurrentUserQueryArgsSchema,
  returns: CurrentUserQueryReturnsSchema,
  handler: async (ctx) => ctx.user,
});

const RecordUserMutationArgsSchema = UserSchema.omit({ createdAt: true }).extend({
  createdAt: requiredInstant.optional(),
});
const RecordUserMutationReturnsSchema = documentId('users');

/**
 * Inserts a `users` row by hand — fixtures and seeds; real rows are `store`'s, keyed by the
 * token the provider signs.
 */
export const recordUser = internalZodMutation({
  args: RecordUserMutationArgsSchema,
  returns: RecordUserMutationReturnsSchema,
  handler: async (ctx, row) =>
    await ctx.db.insert('users', { ...row, createdAt: row.createdAt ?? Date.now() }),
});
