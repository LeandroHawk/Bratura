import { describe, expect, test } from 'vitest';
import { UserMessageChannelSchema } from './entity';

describe('UserMessageChannelSchema', () => {
  test('parses a channel row: destination, opt-in and opt-out', () => {
    expect(
      UserMessageChannelSchema.parse({
        userId: '0000000000000000000000001users',
        channel: 'telegram',
        destination: '123456789',
        optInAt: 1_700_000_000_000,
        optOutAt: null,
      }),
    ).toMatchObject({ channel: 'telegram', optOutAt: null });
  });
});
