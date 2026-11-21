import type {
  UserNotification,
  UserNotificationDraft,
} from '../../entities/user-notification/entity';
import type { Locale } from '../../primitives/external/locale/enum';
import type {
  AnnouncementMessageContent,
  CallMessageContent,
  UserNotificationContent,
} from './content';

/**
 * What a notification says, rendered: `title` and `body` in the reader's locale and `link` —
 * the call's official page, the only link a message ever carries (an announcement has none).
 * The web inbox shows these fields; a channel formats them (`title\n\nbody\n\nlink`).
 */
export type RenderedNotificationMessage = {
  title: string;
  body: string;
  link: string | null;
};

type CallContent = { call: CallMessageContent };
type AnnouncementContent = { announcement: AnnouncementMessageContent };

// One entry per kind and locale: the inbox and every channel say the same thing, and a new kind
// without a message fails `tsc` here. `never` in the satisfies params keeps each entry typed to
// its own variant; `userNotificationMessageOf` below casts at the single dispatch point.
const messages = {
  newEligibleCall: {
    ptBR: (
      notification: Extract<UserNotification, { kind: 'newEligibleCall' }>,
      content: CallContent,
    ): RenderedNotificationMessage => ({
      title:
        notification.matchStatus === 'eligible'
          ? 'Novo edital compatível'
          : 'Edital quase elegível',
      body:
        notification.matchStatus === 'eligible'
          ? `Um novo edital compatível com o seu portfólio foi publicado: ${content.call.callTitle}.${
              content.call.closeText?.ptBR ? ` Inscrições ${content.call.closeText.ptBR}.` : ''
            }`
          : `${content.call.callTitle} quase combina com o seu portfólio — veja na Bratura o que falta para se inscrever.${
              content.call.closeText?.ptBR ? ` Inscrições ${content.call.closeText.ptBR}.` : ''
            }`,
      link: content.call.link,
    }),
    en: (
      notification: Extract<UserNotification, { kind: 'newEligibleCall' }>,
      content: CallContent,
    ): RenderedNotificationMessage => ({
      title: notification.matchStatus === 'eligible' ? 'New matching call' : 'Almost-eligible call',
      body:
        notification.matchStatus === 'eligible'
          ? `A new call matching your portfolio was published: ${content.call.callTitle}.${
              content.call.closeText?.en ? ` Registration ${content.call.closeText.en}.` : ''
            }`
          : `${content.call.callTitle} almost matches your portfolio — see on Bratura what is missing.${
              content.call.closeText?.en ? ` Registration ${content.call.closeText.en}.` : ''
            }`,
      link: content.call.link,
    }),
  },
  deadlineSoon: {
    ptBR: (
      notification: Extract<UserNotification, { kind: 'deadlineSoon' }>,
      content: CallContent,
    ): RenderedNotificationMessage => ({
      title: 'O prazo está chegando',
      body: `${
        notification.occurrence === 'd7' ? 'Faltam 7 dias' : 'Falta 1 dia'
      }: as inscrições de ${content.call.callTitle} ${content.call.closeText?.ptBR ?? 'se encerram em breve'}. Não perca o prazo — acesse a Bratura.`,
      link: content.call.link,
    }),
    en: (
      notification: Extract<UserNotification, { kind: 'deadlineSoon' }>,
      content: CallContent,
    ): RenderedNotificationMessage => ({
      title: 'Deadline approaching',
      body: `${
        notification.occurrence === 'd7' ? '7 days left' : '1 day left'
      }: registration for ${content.call.callTitle} ${content.call.closeText?.en ?? 'closes soon'}. Do not miss the deadline — go to Bratura.`,
      link: content.call.link,
    }),
  },
  callNoticeAmended: {
    ptBR: (
      _notification: Extract<UserNotification, { kind: 'callNoticeAmended' }>,
      content: CallContent,
    ): RenderedNotificationMessage => ({
      title: 'Edital retificado',
      body: `${content.call.callTitle} foi retificado. Veja o que mudou na Bratura.`,
      link: content.call.link,
    }),
    en: (
      _notification: Extract<UserNotification, { kind: 'callNoticeAmended' }>,
      content: CallContent,
    ): RenderedNotificationMessage => ({
      title: 'Call amended',
      body: `${content.call.callTitle} was amended. See what changed on Bratura.`,
      link: content.call.link,
    }),
  },
  platformAnnouncement: {
    ptBR: (
      _notification: Extract<UserNotification, { kind: 'platformAnnouncement' }>,
      content: AnnouncementContent,
    ): RenderedNotificationMessage => ({
      title: content.announcement.title.ptBR,
      body: content.announcement.body.ptBR,
      link: null,
    }),
    en: (
      _notification: Extract<UserNotification, { kind: 'platformAnnouncement' }>,
      content: AnnouncementContent,
    ): RenderedNotificationMessage => ({
      title: content.announcement.title.en,
      body: content.announcement.body.en,
      link: null,
    }),
  },
} satisfies Record<
  UserNotification['kind'],
  Record<'ptBR' | 'en', (notification: never, content: never) => RenderedNotificationMessage>
>;

const localeKeyOf = (locale: Locale) => (locale === 'pt-BR' ? 'ptBR' : 'en');

/**
 * The message a notification renders in `locale`, or `null` when there is no content (its call
 * notice is gone): every channel and the inbox say the same thing from the same content.
 */
export function userNotificationMessageOf(
  notification: UserNotificationDraft,
  content: UserNotificationContent | null,
  locale: Locale,
): RenderedNotificationMessage | null {
  if (content === null) return null;
  const render = messages[notification.kind][localeKeyOf(locale)];
  return render(notification as never, content as never);
}
