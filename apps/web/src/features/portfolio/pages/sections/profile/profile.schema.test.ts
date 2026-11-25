import { emptyCulturalProfile } from '@bratura/shared/entities/creator/entity';
import { afterEach, expect, test, vi } from 'vitest';
import { CulturalProfileFormSchema } from './profile.schema';

afterEach(() => vi.useRealTimers());
test('the form rejects a future activity year without putting a clock in the entity', () => {
  vi.useFakeTimers({ toFake: ['Date'], now: Date.UTC(2026, 10, 22) });
  expect(
    CulturalProfileFormSchema.safeParse({ ...emptyCulturalProfile, activityStartYear: 2027 })
      .success,
  ).toBe(false);
  expect(
    CulturalProfileFormSchema.safeParse({ ...emptyCulturalProfile, activityStartYear: 2026 })
      .success,
  ).toBe(true);
});
