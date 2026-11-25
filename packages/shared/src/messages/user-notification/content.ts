import type { ZonedInstant } from '../../primitives/code/time/zoned-instant/fields';
import {
  callNoticeDeadline,
  type CallNoticeDeadline,
} from '../../entities/call-notice/fragments/registration-window/fields';
import type { UserNotificationDraft } from '../../entities/user-notification/entity';
import { callNoticeTitleForMessage } from './call-title';
import { registrationCloseText } from './deadline';

/** What a call-notice row must carry for a notification to be worth saying. */
export type CallNoticeForMessage = {
  title: string;
  officialUrl: string;
  registrationCloses: ZonedInstant | null;
};

export type CallMessageContent = {
  /** The call's title, cleaned and quoted — the only place a source's text enters a message. */
  callTitle: string;
  /** "encerram em 21/11, às 23h59" / "close on 11/21 at …", in both locales, or none to say. */
  closeText: Record<'ptBR' | 'en', string | null> | null;
  /** Days from `now` to the close (negative once past); `null` when the source gives none. */
  daysLeft: number | null;
  /** Where the call stands for the deadline check a sender may still run. */
  deadline: CallNoticeDeadline;
  /** The official page — the only link a message ever carries (`docs/security.md` §3). */
  link: string;
};

export type AnnouncementMessageContent = {
  title: { ptBR: string; en: string };
  body: { ptBR: string; en: string };
};

/** The data a notification message renders from, built once for every channel and locale. */
export type UserNotificationContent =
  { call: CallMessageContent } | { announcement: AnnouncementMessageContent };

const dayMs = 24 * 60 * 60 * 1000;

/**
 * What a notification's message is built from: the call's title, official link and close — or
 * the announcement's own text. `null` when the subject is gone, so nothing renders a message
 * without it. `now` is passed in: the same content must render in tests at a fixed instant.
 */
export function userNotificationContentOf(
  notification: UserNotificationDraft,
  callNotice: CallNoticeForMessage | null,
  now: number,
): UserNotificationContent | null {
  if (notification.kind === 'platformAnnouncement')
    return { announcement: { title: notification.title, body: notification.body } };
  if (callNotice === null) return null;
  const deadline = callNoticeDeadline({ registrationCloses: callNotice.registrationCloses }, now);
  const closes = callNotice.registrationCloses;
  const closeText =
    deadline === 'openEnded' || closes === null
      ? null
      : { ptBR: registrationCloseText(closes, 'pt-BR'), en: registrationCloseText(closes, 'en') };
  return {
    call: {
      callTitle: callNoticeTitleForMessage(callNotice.title),
      closeText,
      daysLeft: closes === null ? null : (closes.at - now) / dayMs,
      deadline,
      link: callNotice.officialUrl,
    },
  };
}
