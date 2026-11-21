import type { CallNoticeWithMatch } from '@bratura/shared/entities/call-notice/dto/bratura-portal/eligible-call-notices/query';
import { MatchClassificationEnum } from '@bratura/shared/entities/call-notice/dto/bratura-portal/eligible-call-notices/query';
import type { Creator } from '@bratura/shared/entities/creator/entity';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Heading } from '@bratura/ui';
import { Counters } from '@/features/call-notices/pages/sections/common/Counters';
import { CREATOR_LABELS } from '@/features/common/content/creator-labels';
import { formattedDayOfInstant } from '@/features/common/utils/format';
import { MATCH_SUMMARY_CONTENT } from './content';

/** Whose fit this is and how many calls fall in each answer. */
export function MatchSummary({
  locale,
  creator,
  callNotices,
}: {
  locale: Locale;
  creator: Creator;
  callNotices: CallNoticeWithMatch[];
}) {
  const content = MATCH_SUMMARY_CONTENT[locale];
  const labels = CREATOR_LABELS[locale];
  const analyzedAt = callNotices.find((callNotice) => callNotice.match)?.match?.analyzedAt;

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Heading as="h1" size="section">
          {content.title}
        </Heading>
        <p className="max-w-[60ch] text-muted-foreground">
          {content.lead(creator.artisticName ?? creator.fullName)}
        </p>
        <p className="text-small">
          <span className="font-semibold">{content.mainArea}:</span>{' '}
          {creator.mainCulturalArea
            ? labels.culturalArea[creator.mainCulturalArea]
            : labels.notInformed}
          {' · '}
          <span className="font-semibold">{content.lastAnalysis}:</span>{' '}
          {analyzedAt ? formattedDayOfInstant(analyzedAt, locale) : labels.notInformed}
        </p>
      </div>
      <Counters
        counters={MatchClassificationEnum.options.map((classification) => ({
          label: content.counts[classification],
          count: callNotices.filter(
            (callNotice) => callNotice.match?.classification === classification,
          ).length,
        }))}
      />
    </div>
  );
}
