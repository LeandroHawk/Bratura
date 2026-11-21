import type { CallNoticeCounters } from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-counters/query';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Heading } from '@bratura/ui';
import { Counters } from '@/features/call-notices/pages/sections/common/Counters';
import { OVERVIEW_COUNTERS_CONTENT } from './content';

/** How many calls for creators there are, by where each stands, counted by the server. */
export function OverviewCounters({
  locale,
  counters,
  savedCount,
}: {
  locale: Locale;
  counters: CallNoticeCounters | null;
  savedCount: number;
}) {
  const content = OVERVIEW_COUNTERS_CONTENT[locale];

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
          { label: content.counts.open, count: counters?.open ?? null },
          { label: content.counts.closingSoon, count: counters?.closingSoon ?? null },
          { label: content.counts.isNew, count: counters?.isNew ?? null },
          { label: content.counts.saved, count: savedCount },
        ]}
      />
    </div>
  );
}
