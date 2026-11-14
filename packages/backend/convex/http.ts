import { httpRouter } from 'convex/server';

// Routes only: each handler lives in its subject's file. Planned: Nvoip's inbound messages, if
// Nvoip forwards them (`docs/integrations/whatsapp.md`), and Firecrawl's batch webhooks.
const http = httpRouter();

export default http;
