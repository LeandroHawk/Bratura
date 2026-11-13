import { defineSchema, defineTable } from 'convex/server';
import { zodToConvex } from 'convex-helpers/server/zod4';
import { CallNoticeSchema } from '@bratura/shared/entities/call-notice/entity';
import { IngestionRunSchema } from '@bratura/shared/entities/ingestion-run/entity';
import { SourceSchema } from '@bratura/shared/entities/source/entity';

// Each table is its entity's Zod, never a validator written beside it (docs/architecture.md §3).
export default defineSchema({
  sources: defineTable(zodToConvex(SourceSchema)).index('by_slug', ['slug']),
  callNotices: defineTable(zodToConvex(CallNoticeSchema)).index('by_source_and_external_id', [
    'sourceId',
    'externalId',
  ]),
  ingestionRuns: defineTable(zodToConvex(IngestionRunSchema)).index('by_source', ['sourceId']),
});
