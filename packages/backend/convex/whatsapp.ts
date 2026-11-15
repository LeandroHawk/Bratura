import { z } from 'zod';
import { internalZodAction } from './lib/builders';
import { requiredEnv } from './lib/env';
import { fetchNvoipAccessToken } from './model/whatsapp/nvoip/client';

// The WhatsApp port (`docs/integrations/whatsapp.md`): sends go through the
// `notificationDeliveries` outbox; inbound ("Meus editais") lands here later. Only the
// credentials check exists yet.

const CheckNvoipCredentialsActionArgsSchema = z.object({});
const CheckNvoipCredentialsActionReturnsSchema = z.literal(true);

/**
 * Proves this deployment's Nvoip credentials get a token; sends nothing. Run it after `env set`.
 */
export const checkNvoipCredentials = internalZodAction({
  args: CheckNvoipCredentialsActionArgsSchema,
  returns: CheckNvoipCredentialsActionReturnsSchema,
  handler: async () => {
    await fetchNvoipAccessToken({
      clientId: requiredEnv('NVOIP_CLIENT_ID'),
      clientSecret: requiredEnv('NVOIP_CLIENT_SECRET'),
    });
    return true as const;
  },
});
