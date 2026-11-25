import { z } from 'zod';
import { requiredString } from '../../../../primitives/code/string/fields';

/**
 * Writes: the creator's form, once, when the item is created. Comes from: `crypto.randomUUID()`.
 * The key the client makes, so a double click or a retry writes one item, not two
 * (`docs/architecture.md`, client intent). Whose item it is comes from the session, never an arg.
 */
export const PortfolioItemIdentityFields = z.object({
  clientItemId: requiredString('short'),
});
