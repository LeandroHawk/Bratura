import { z } from 'zod';
import { UserMessageChannelSchema } from '@bratura/shared/entities/user-message-channel/entity';
import { DeliveryChannelEnum } from '@bratura/shared/primitives/domain/delivery-channel/enum';
import { documentId } from '@bratura/shared/primitives/code/id/fields';
import { nullableString } from '@bratura/shared/primitives/code/string/fields';
import { requiredInstant } from '@bratura/shared/primitives/code/time/instant/fields';
import type { QueryCtx } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import type { GenericId } from 'convex/values';
import { internalZodMutation, internalZodQuery } from './lib/builders';

// `userMessageChannels`: where each user is reachable, with their opt-in and opt-out — the only
// table holding a destination, so the send resolves it here and LGPD erasure has one place. The
// only writer; the demo creator's row is seeded by hand until the inbound webhook fills it.
// Return types are written out: `notificationDeliveries` calls these through `internal`.

const channelOf = async (
  ctx: QueryCtx,
  userId: GenericId<'users'>,
  channel: Doc<'userMessageChannels'>['channel'],
) =>
  await ctx.db
    .query('userMessageChannels')
    .withIndex('by_user_and_channel', (index) => index.eq('userId', userId).eq('channel', channel))
    .unique();

const SetMessageChannelMutationArgsSchema = UserMessageChannelSchema;
const SetMessageChannelMutationReturnsSchema = documentId('userMessageChannels');

/**
 * Registers or updates where a user is reachable on a channel (natural-key upsert on user +
 * channel). `optInAt`/`optOutAt` come from the caller: a re-opt-in (`/start` after a block)
 * clears `optOutAt` by writing it `null`.
 */
export const setMessageChannel = internalZodMutation({
  args: SetMessageChannelMutationArgsSchema,
  returns: SetMessageChannelMutationReturnsSchema,
  handler: async (ctx, row) => {
    const known = await channelOf(ctx, row.userId, row.channel);
    if (known) {
      await ctx.db.patch(known._id, {
        destination: row.destination,
        optInAt: row.optInAt,
        optOutAt: row.optOutAt,
      });
      return known._id;
    }
    return await ctx.db.insert('userMessageChannels', row);
  },
});

const DestinationForUserQueryArgsSchema = z.object({
  userId: documentId('users'),
  channel: DeliveryChannelEnum,
});
const DestinationForUserQueryReturnsSchema = nullableString('short');

/**
 * Where to send on a channel, or `null`: no row, no opt-in, or an opt-out all mean "do not send".
 */
export const destinationForUser = internalZodQuery({
  args: DestinationForUserQueryArgsSchema,
  returns: DestinationForUserQueryReturnsSchema,
  handler: async (ctx, { userId, channel }) => {
    const row = await channelOf(ctx, userId, channel);
    if (row === null || row.optOutAt !== null) return null;
    return row.destination;
  },
});

const MarkChannelOptOutMutationArgsSchema = z.object({
  userId: documentId('users'),
  channel: DeliveryChannelEnum,
  optOutAt: requiredInstant,
});
const MarkChannelOptOutMutationReturnsSchema = z.null();

/**
 * Records an opt-out on a user's channel (a `/parar`, a 403 from the provider). Idempotent: the
 * first opt-out time wins.
 */
export const markChannelOptOut = internalZodMutation({
  args: MarkChannelOptOutMutationArgsSchema,
  returns: MarkChannelOptOutMutationReturnsSchema,
  handler: async (ctx, { userId, channel, optOutAt }): Promise<null> => {
    const row = await channelOf(ctx, userId, channel);
    if (row !== null && row.optOutAt === null) await ctx.db.patch(row._id, { optOutAt });
    return null;
  },
});
