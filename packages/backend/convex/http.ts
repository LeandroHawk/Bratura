import { httpRouter } from 'convex/server';
import { abacatePayWebhook } from './billing';

// Routes only: each handler lives in its subject's file. Planned: the Telegram webhook
// (`docs/integrations/telegram.md`) and Firecrawl's batch webhooks.
const http = httpRouter();

// AbacatePay's billing deliveries (`docs/integrations/abacate-pay.md`).
http.route({ path: '/abacatepay/webhook', method: 'POST', handler: abacatePayWebhook });

export default http;
