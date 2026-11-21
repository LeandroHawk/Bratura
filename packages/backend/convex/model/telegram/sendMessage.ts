import type { UserNotificationDraft } from '@bratura/shared/entities/user-notification/entity';
import type { CallNoticeForMessage } from '@bratura/shared/messages/user-notification/content';
import { userNotificationContentOf } from '@bratura/shared/messages/user-notification/content';
import { userNotificationMessageOf } from '@bratura/shared/messages/user-notification/messages';
import { sendTelegramMessage } from './client';

export type TelegramNotificationSend = {
  /** `TELEGRAM_BOT_TOKEN`, read by the caller from env. */
  token: string;
  notification: UserNotificationDraft;
  /** The stored call notice for kinds that name it; `null` when it is gone. */
  callNotice: CallNoticeForMessage | null;
  /** The recipient's chat id, read off `userMessageChannels` at send time. */
  destination: string;
  /** The instant the message is built at — close text and days-left come from it. */
  now: number;
};

export type TelegramSendOutcome =
  | { outcome: 'sent'; providerMessageId: string | null }
  /** No message fits (a call-notice kind whose notice is gone): release the claim, do not fail. */
  | { outcome: 'noContent' };

/**
 * The only function the doors import for Telegram sends (`docs/integrations/telegram.md`): the
 * message itself lives in `shared/messages/user-notification` (same text as the web inbox, in
 * pt-BR and en); this adapter only formats it as plain text and calls the Bot API.
 */
export async function sendTelegramNotification({
  token,
  notification,
  callNotice,
  destination,
  now,
}: TelegramNotificationSend): Promise<TelegramSendOutcome> {
  const content = userNotificationContentOf(notification, callNotice, now);
  const message = userNotificationMessageOf(notification, content, 'pt-BR');
  if (message === null) return { outcome: 'noContent' };
  const text = [message.title, message.body, message.link].filter(Boolean).join('\n\n');
  const providerMessageId = await sendTelegramMessage({ token, chatId: destination, text });
  return { outcome: 'sent', providerMessageId };
}
