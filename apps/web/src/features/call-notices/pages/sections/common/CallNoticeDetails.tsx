'use client';

import type { CallNoticeCard } from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-cards/query';
import type { SavedCallNotice as SavedCallNoticeRow } from '@bratura/shared/entities/call-notice/dto/bratura-portal/saved-call-notice/mutation';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Checkbox, Dialog } from '@bratura/ui';
import { useCallNoticeDetails } from '@/features/call-notices/data/useCallNoticeDetails';
import { CALL_NOTICE_LANGUAGE } from './callNoticeTexts';
import { CallNoticeDetailsBody, DetailsSection } from './CallNoticeDetailsBody';
import { CALL_NOTICES_CONTENT } from './content';

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
  const copy = CALL_NOTICES_CONTENT[locale].details;
  const details = useCallNoticeDetails(callNotice.callNoticeId);

  return (
    <Dialog
      open
      onClose={onClose}
      title={callNotice.title}
      titleLang={CALL_NOTICE_LANGUAGE}
      closeLabel={copy.close}
    >
      <div className="grid gap-8">
        {details ? (
          <CallNoticeDetailsBody locale={locale} details={details} />
        ) : (
          <p role="status">{copy.loading}</p>
        )}

        <DetailsSection title={copy.alertsTitle} lead={copy.alertsLead}>
          <div className="grid gap-2">
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
        </DetailsSection>
      </div>
    </Dialog>
  );
}
