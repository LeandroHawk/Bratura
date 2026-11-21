import { describe, expect, test } from 'vitest';
import { NotificationDeliveryReservationFields } from './fragments/reservation/fields';
import {
  FailedNotificationDeliverySchema,
  SendingNotificationDeliverySchema,
  SentNotificationDeliverySchema,
} from './entity';

// The entity spreads identity fields and the reservation fragment into each status variant: a
// key the fragment renames must break this test, not silently change what the table stores
// (docs/contracts.md §1).
describe('NotificationDeliverySchema', () => {
  const identityKeys = ['notificationId', 'userId', 'channel'];

  test('every variant carries the identity fields and no duplicate keys', () => {
    for (const variant of [
      SendingNotificationDeliverySchema,
      SentNotificationDeliverySchema,
      FailedNotificationDeliverySchema,
    ]) {
      const keys = Object.keys(variant.shape);
      expect(new Set(keys).size).toBe(keys.length);
      for (const key of identityKeys) expect(keys).toContain(key);
    }
  });

  test('the sending variant carries the reservation fields', () => {
    for (const key of Object.keys(NotificationDeliveryReservationFields.shape))
      expect(SendingNotificationDeliverySchema.shape).toHaveProperty(key);
  });
});
