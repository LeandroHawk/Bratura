import { z } from 'zod';
import { documentId } from '@bratura/shared/primitives/code/id/fields';
import { internalZodMutation } from './lib/builders';

// `users`: who the rows belong to. Today a bare row — WorkOS supplies the identity when login
// lands (`docs/plan.md`); notifications, deliveries and message channels already reference it.
// The only writer.

const RecordUserMutationArgsSchema = z.object({});
const RecordUserMutationReturnsSchema = documentId('users');

/**
 * Creates a user row. There is no natural key yet (the WorkOS id arrives with login), so a call
 * inserts — callers that mean "find or create" wait for the auth link to dedupe on.
 */
export const recordUser = internalZodMutation({
  args: RecordUserMutationArgsSchema,
  returns: RecordUserMutationReturnsSchema,
  handler: async (ctx) => await ctx.db.insert('users', { createdAt: Date.now() }),
});
