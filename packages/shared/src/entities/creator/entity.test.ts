import { describe, expect, test } from 'vitest';
import { CreatorSchema, emptyCulturalProfile } from './entity';
import { CreatorCulturalProfileFields } from './fragments/cultural-profile/fields';
import { CreatorRegistrationFields } from './fragments/registration/fields';

const registration = {
  email: 'maria@example.com',
  applicantType: 'individual',
  state: 'CE',
  city: 'Juazeiro do Norte',
};

describe('CreatorSchema', () => {
  // A spread lets a repeated key win in silence (docs/contracts.md §1).
  test('no two fragments declare the same field', () => {
    const fields = [CreatorRegistrationFields, CreatorCulturalProfileFields].flatMap((fragment) =>
      Object.keys(fragment.shape),
    );
    expect(new Set(fields).size).toBe(fields.length);
  });

  test('a sign-up plus the empty cultural profile is a whole creator', () => {
    expect(CreatorSchema.safeParse({ ...registration, ...emptyCulturalProfile }).success).toBe(
      true,
    );
  });

  test('compares e-mails in lowercase', () => {
    expect(CreatorRegistrationFields.shape.email.parse('Maria@Example.com')).toBe(
      'maria@example.com',
    );
  });

  test('keeps the entity independent of the current clock', () => {
    const nextYear = 2200;
    expect(CreatorCulturalProfileFields.shape.activityStartYear.safeParse(nextYear).success).toBe(
      true,
    );
  });
});
