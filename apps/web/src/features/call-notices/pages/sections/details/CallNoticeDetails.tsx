'use client';

import type { CallNoticeCard } from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-cards/query';
import type { SavedCallNotice as SavedCallNoticeRow } from '@bratura/shared/entities/call-notice/dto/bratura-portal/saved-call-notice/mutation';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Checkbox, Dialog, Heading, Loading } from '@bratura/ui';
import { useCallNoticeDetails } from '@/features/call-notices/data/useCallNoticeDetails';
import { CALL_NOTICE_LANGUAGE } from '@/features/call-notices/pages/sections/common/callNoticeTexts';
import { CallNoticeDetailsBody } from './CallNoticeDetailsBody';
import { CALL_NOTICE_DETAILS_CONTENT } from './content';

type SavedCallNotice = Pick<SavedCallNoticeRow, 'remindersOn'>;

/**
 * One call's dialog: its details, read from the server when it opens, and whether to follow it.
 */
export function CallNoticeDetails({
  locale,
  callNotice,
  saved,
  onSavedChange,
  onClose,
}: {
  locale: Locale;
  /** The card that was opened: its title heads the dialog while the details load. */
  callNotice: CallNoticeCard;
  saved: SavedCallNotice | null;
  onSavedChange: (saved: SavedCallNotice | null) => void;
  onClose: () => void;
}) {
  const copy = CALL_NOTICE_DETAILS_CONTENT[locale];
  const details = useCallNoticeDetails(callNotice.callNoticeId);

  return (
    <Dialog
      open
      onClose={onClose}
      title={callNotice.title}
      titleLang={CALL_NOTICE_LANGUAGE}
      closeLabel={copy.close}
    >
      {/* The alerts wait for the details: shown alone first, they read as the call's content. */}
      {details ? (
        <div className="grid gap-6">
          <CallNoticeDetailsBody locale={locale} details={details} />

          {/* A preference, not something to read: the footer, under the sand's hairline. */}
          <section className="grid gap-2 border-t border-sand-edge pt-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <Heading as="h3" size="item" className="text-sand-ink">
                {copy.alertsTitle}
              </Heading>
              <Checkbox
                checked={saved !== null}
                onChange={(event) =>
                  onSavedChange(event.target.checked ? { remindersOn: false } : null)
                }
              >
                {copy.saveCall}
              </Checkbox>
              <Checkbox
                checked={saved?.remindersOn ?? false}
                onChange={(event) => onSavedChange({ remindersOn: event.target.checked })}
              >
                {copy.reminders}
              </Checkbox>
            </div>
            <p className="text-caption text-muted-foreground">{copy.alertsLead}</p>
          </section>
        </div>
      ) : (
        <Loading label={copy.loading} />
      )}
    </Dialog>
  );
}
