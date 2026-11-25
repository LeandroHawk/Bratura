import type { CallNoticeCounters } from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-counters/query';
import { MatchClassificationEnum } from '@bratura/shared/entities/match/enums/classification/enum';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Heading } from '@bratura/ui';
import { Counters } from '@/features/call-notices/pages/sections/common/Counters';
import { MATCH_SUMMARY_CONTENT } from './content';

/** Whose fit this is and how many open calls fall in each answer, counted by the server. */
export function MatchSummary({
  locale,
  counters,
}: {
  locale: Locale;
  counters: CallNoticeCounters | null;
}) {
  const content = MATCH_SUMMARY_CONTENT[locale];

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Heading as="h1" size="section">
          {content.title}
        </Heading>
        <p className="max-w-[60ch] text-muted-foreground">{content.lead}</p>
      </div>
      <Counters
        counters={MatchClassificationEnum.options.map((classification) => ({
          label: content.counts[classification],
          count: counters?.byClassification[classification] ?? null,
        }))}
      />
    </div>
  );
}
