import { describe, expect, test } from 'vitest';
import { UserSchema } from './entity';

describe('UserSchema', () => {
  test('parses a user row', () => {
    const row = {
      tokenIdentifier: 'https://api.workos.com/|user_01ABC',
      name: 'Ana',
      email: 'ana@example.com',
      createdAt: 1_700_000_000_000,
    };
    expect(UserSchema.parse(row)).toEqual(row);
  });
});
