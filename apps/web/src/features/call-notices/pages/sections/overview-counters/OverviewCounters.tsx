import type { CallNoticeWithMatch } from '@bratura/shared/entities/call-notice/dto/bratura-portal/eligible-call-notices/query';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Heading } from '@bratura/ui';
import { Counters } from '@/features/call-notices/pages/sections/common/Counters';
import {
  callNoticeStatus,
  isNewCallNotice,
} from '@/features/call-notices/pages/sections/common/filtering';
import { OVERVIEW_COUNTERS_CONTENT } from './content';

/** How many calls there are, by where each stands. */
export function OverviewCounters({
  locale,
  callNotices,
  savedCount,
  now,
}: {
  locale: Locale;
  callNotices: CallNoticeWithMatch[];
  savedCount: number;
  now: number;
}) {
  const content = OVERVIEW_COUNTERS_CONTENT[locale];
  const statuses = callNotices.map((callNotice) => callNoticeStatus(callNotice, now));

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Heading as="h1" size="section">
          {content.title}
        </Heading>
        <p className="max-w-[60ch] text-muted-foreground">{content.lead}</p>
      </div>
      <Counters
        counters={[
          { label: content.counts.total, count: callNotices.length },
          {
            label: content.counts.open,
            // Closing soon is still open.
            count: statuses.filter((status) => status === 'open' || status === 'closingSoon')
              .length,
          },
          {
            label: content.counts.closingSoon,
            count: statuses.filter((status) => status === 'closingSoon').length,
          },
          {
            label: content.counts.isNew,
            count: callNotices.filter((callNotice) => isNewCallNotice(callNotice, now)).length,
          },
          { label: content.counts.saved, count: savedCount },
        ]}
      />
    </div>
  );
}
