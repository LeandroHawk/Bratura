import { defineSchema, defineTable } from 'convex/server';
import { rateLimitTables } from 'convex-helpers/server/rateLimit';
import { zodToConvex } from 'convex-helpers/server/zod4';
import { CallNoticeSchema } from '@bratura/shared/entities/call-notice/entity';
import { CallNoticeDocumentSchema } from '@bratura/shared/entities/call-notice-document/entity';
import { CallNoticeExtractionSchema } from '@bratura/shared/entities/call-notice-extraction/entity';
import { IngestionRunSchema } from '@bratura/shared/entities/ingestion-run/entity';
import { NotificationDeliverySchema } from '@bratura/shared/entities/notification-delivery/entity';
import { SourceSchema } from '@bratura/shared/entities/source/entity';
import { UserMessageChannelSchema } from '@bratura/shared/entities/user-message-channel/entity';
import { UserNotificationSchema } from '@bratura/shared/entities/user-notification/entity';

// Each table is its entity's Zod, never a validator written beside it (docs/architecture.md §3).
// `rateLimits` is convex-helpers' own table (the send cap), not an entity: it is the exception.
export default defineSchema({
  ...rateLimitTables,
  sources: defineTable(zodToConvex(SourceSchema))
    .index('by_slug', ['slug'])
    .index('by_is_active', ['isActive']),
  callNotices: defineTable(zodToConvex(CallNoticeSchema))
    .index('by_source_and_external_id', ['sourceId', 'externalId'])
    .index('by_registration_closes', ['registrationCloses.at']),
  callNoticeDocuments: defineTable(zodToConvex(CallNoticeDocumentSchema))
    .index('by_call_notice_and_url', ['callNoticeId', 'url'])
    .index('by_status', ['status']),
  callNoticeExtractions: defineTable(zodToConvex(CallNoticeExtractionSchema)).index(
    'by_call_notice',
    ['callNoticeId'],
  ),
  ingestionRuns: defineTable(zodToConvex(IngestionRunSchema)).index('by_source_and_status', [
    'sourceId',
    'status',
  ]),
  userNotifications: defineTable(zodToConvex(UserNotificationSchema)).index(
    'by_user_and_dedupe_key',
    ['userId', 'dedupeKey'],
  ),
  notificationDeliveries: defineTable(zodToConvex(NotificationDeliverySchema))
    .index('by_notification_and_channel', ['notificationId', 'channel'])
    .index('by_status', ['status']),
  userMessageChannels: defineTable(zodToConvex(UserMessageChannelSchema)).index(
    'by_user_and_channel',
    ['userId', 'channel'],
  ),
});
