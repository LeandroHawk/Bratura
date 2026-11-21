import { z } from 'zod';
import { documentId } from '../../../../primitives/code/id/fields';
import { requiredString } from '../../../../primitives/code/string/fields';
import { requiredHttpsUrl } from '../../../../primitives/code/url/fields';
import { requiredInstant } from '../../../../primitives/code/time/instant/fields';

/**
 * Writes: `billing.ts`, when a subscription checkout is opened. Comes from: the organization row
 * and AbacatePay's answer. What stays the same through the subscription's whole lifecycle.
 */
export const BillingSubscriptionIdentityFields = z.object({
  /** The organization the panel belongs to. */
  organizationId: documentId('organizations'),
  /** The provider's checkout (`bill_...`): the first charge's page and the link webhooks carry. */
  abacatePayCheckoutId: requiredString('short'),
  /** Where the organization pays the first charge: an AbacatePay-hosted page, always https. */
  checkoutUrl: requiredHttpsUrl,
  /** The provider's customer (`cust_...`) the checkout bills. */
  abacatePayCustomerId: requiredString('short'),
  /** How many managed profiles each cycle bills (the "per managed profile" price times this). */
  managedProfiles: z.int().positive(),
  /** The provider's sandbox flag: `true` rows can never come from a production key. */
  devMode: z.boolean(),
  /** When the row was created and when it last changed. */
  createdAt: requiredInstant,
  updatedAt: requiredInstant,
});
