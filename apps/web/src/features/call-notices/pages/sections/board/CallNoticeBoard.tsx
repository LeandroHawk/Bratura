import type { CallNoticeCard as CallNoticeCardData } from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-cards/query';
import type { SavedCallNotice } from '@bratura/shared/entities/call-notice/dto/bratura-portal/saved-call-notice/mutation';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Button, Loading } from '@bratura/ui';
import { BoardPin } from '@/features/common/components/BoardPin';
import { CallNoticeCard } from './CallNoticeCard';
import { CALL_NOTICE_BOARD_CONTENT } from './content';

/**
 * The calls pinned to a cork board, the landing's notice board: same materials. `callNotices` is
 * `null` while the first page is on its way; `loadMore` is set while there is a next page.
 */
export function CallNoticeBoard({
  locale,
  callNotices,
  savedById,
  asksEligibility,
  loadMore,
  isLoadingMore,
  onOpenDetails,
  onToggleSaved,
}: {
  locale: Locale;
  callNotices: CallNoticeCardData[] | null;
  savedById: ReadonlyMap<string, SavedCallNotice>;
  /** On every call (not only the fit): the card invites to check eligibility, not to see more. */
  asksEligibility: boolean;
  loadMore: (() => void) | null;
  isLoadingMore: boolean;
  onOpenDetails: (callNotice: CallNoticeCardData) => void;
  onToggleSaved: (callNotice: CallNoticeCardData, isSaved: boolean) => void;
}) {
  const content = CALL_NOTICE_BOARD_CONTENT[locale];
  if (callNotices === null) return <Loading label={content.loading} />;
  return (
    <>
      {callNotices.length === 0 ? (
        <p className="text-muted-foreground">{content.noResults}</p>
      ) : (
        <ul className="grid items-start gap-8 rounded-xl border-[6px] border-wood bg-board p-3 pt-6 shadow-lifted outline-2 outline-wood-edge sm:border-[10px] sm:p-6 sm:pt-8 md:grid-cols-2 xl:grid-cols-3">
          {callNotices.map((callNotice, index) => {
            const isSaved = savedById.has(callNotice.callNoticeId);
            return (
              <li key={callNotice.callNoticeId} className="relative">
                <BoardPin index={index} />
                <CallNoticeCard
                  locale={locale}
                  callNotice={callNotice}
                  isSaved={isSaved}
                  index={index}
                  detailsLabel={asksEligibility ? content.checkEligibility : content.details}
                  onOpenDetails={() => onOpenDetails(callNotice)}
                  onToggleSaved={() => onToggleSaved(callNotice, isSaved)}
                />
              </li>
            );
          })}
        </ul>
      )}
      {loadMore && (
        <div>
          <Button variant="ghost" onClick={loadMore}>
            {content.loadMore}
          </Button>
        </div>
      )}
      {isLoadingMore && <Loading inline label={content.loadingMore} />}
    </>
  );
}
