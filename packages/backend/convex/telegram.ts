import { z } from 'zod';
import { internalZodAction } from './lib/builders';
import { requiredEnv } from './lib/env';
import { fetchTelegramBot } from './model/telegram/client';

// The Telegram port (`docs/integrations/telegram.md`): sends go through the
// `notificationDeliveries` outbox; inbound (/start, /parar) lands here later. Only the
// credentials check exists yet.

const CheckTelegramCredentialsActionArgsSchema = z.object({});
const CheckTelegramCredentialsActionReturnsSchema = z.literal(true);

/**
 * Proves this deployment's `TELEGRAM_BOT_TOKEN` answers `getMe`; sends nothing. Run it after
 * `env set`.
 */
export const checkTelegramCredentials = internalZodAction({
  args: CheckTelegramCredentialsActionArgsSchema,
  returns: CheckTelegramCredentialsActionReturnsSchema,
  handler: async () => {
    await fetchTelegramBot({ token: requiredEnv('TELEGRAM_BOT_TOKEN') });
    return true as const;
  },
});
