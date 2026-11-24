import type { CallNoticeCard } from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-cards/query';
import { registrationCloseDateText } from '@bratura/shared/messages/user-notification/deadline';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import type { BadgeTone } from '@bratura/ui';
import { CREATOR_LABELS } from '@/features/common/content/creator-labels';
import { CALL_NOTICES_CONTENT } from './content';

/** What a call says of itself stays in the call's language, whatever the page's. */
export const CALL_NOTICE_LANGUAGE = 'pt-BR';

/** Where a call stands, as its badge says it: the server's deadline, split by "closes soon". */
export type CallNoticeStatus = CallNoticeCard['deadline'] | 'closingSoon';

export function callNoticeStatus({
  deadline,
  closesSoon,
}: Pick<CallNoticeCard, 'deadline' | 'closesSoon'>): CallNoticeStatus {
  return closesSoon ? 'closingSoon' : deadline;
}

export const STATUS_TONE: Record<CallNoticeStatus, BadgeTone> = {
  open: 'open',
  closingSoon: 'soon',
  openEnded: 'open',
  closed: 'missing',
  notInformed: 'soon',
};

export const CLASSIFICATION_TONE: Record<CallNoticeCard['classification'], BadgeTone> = {
  eligible: 'open',
  almostEligible: 'soon',
  notEligible: 'missing',
};

/** An art form's name; `any` is every area. */
export function artFormName(artForm: CallNoticeCard['artForms'][number], locale: Locale) {
  return artForm === 'any'
    ? CALL_NOTICES_CONTENT[locale].anyArtForm
    : CREATOR_LABELS[locale].culturalArea[artForm];
}

/**
 * The registration close a card or the details show, through the one formatter of a close; `null`
 * when the source gives none or only an open-ended sentinel.
 */
export function closeText(
  { deadline, registrationCloses }: Pick<CallNoticeCard, 'deadline' | 'registrationCloses'>,
  locale: Locale,
) {
  if (deadline === 'openEnded') return CALL_NOTICES_CONTENT[locale].openEndedClose;
  return registrationCloses === null ? null : registrationCloseDateText(registrationCloses, locale);
}
