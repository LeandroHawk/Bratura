import { describe, expect, test } from 'vitest';
import { UserSchema } from './entity';

describe('UserSchema', () => {
  test('parses a user row', () => {
    expect(UserSchema.parse({ createdAt: 1_700_000_000_000 })).toEqual({
      createdAt: 1_700_000_000_000,
    });
  });
});
