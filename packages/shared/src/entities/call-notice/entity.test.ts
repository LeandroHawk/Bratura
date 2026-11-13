import { describe, expect, test } from 'vitest';
import { CallNoticeListingFields } from './fragments/listing/fields';
import { CallNoticeRegistrationWindowFields } from './fragments/registration-window/fields';
import { CallNoticeTrackingFields } from './fragments/tracking/fields';

// A spread lets a repeated key win in silence: two fragments declaring the same field would leave
// the entity with whichever came last (docs/contracts.md §1).
describe('CallNoticeSchema fragments', () => {
  test('no two fragments declare the same field', () => {
    const fields = [
      CallNoticeListingFields,
      CallNoticeRegistrationWindowFields,
      CallNoticeTrackingFields,
    ].flatMap((fragment) => Object.keys(fragment.shape));
    expect(new Set(fields).size).toBe(fields.length);
  });
});
