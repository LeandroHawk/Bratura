import { httpRouter } from 'convex/server';

// Routes only: each handler lives in its subject's file. Planned: the Telegram webhook
// (`docs/integrations/telegram.md`) and Firecrawl's batch webhooks.
const http = httpRouter();

export default http;
