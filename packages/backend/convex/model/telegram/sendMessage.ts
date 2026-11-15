import type { UserNotificationDraft } from '@bratura/shared/entities/user-notification/entity';
import { sendTelegramMessage } from './client';
import { telegramMessageOfNotification } from './messageText';

export type TelegramNotificationSend = {
  /** `TELEGRAM_BOT_TOKEN`, read by the caller from env. */
  token: string;
  notification: UserNotificationDraft;
  /** The stored call notice's title for kinds that name it; `null` when it is gone. */
  callNoticeTitle: string | null;
  /** The recipient's chat id, resolved from `users` at send time — never stored in a table. */
  destination: string;
};

export type TelegramSendOutcome =
  | { outcome: 'sent'; providerMessageId: string | null }
  /** No message fits (a call-notice kind whose notice is gone): release the claim, do not fail. */
  | { outcome: 'noContent' };

/**
 * The only function the doors import for Telegram sends (`docs/integrations/telegram.md`): maps
 * the notification kind to its pt-BR text and sends through the Bot API.
 */
export async function sendTelegramNotification({
  token,
  notification,
  callNoticeTitle,
  destination,
}: TelegramNotificationSend): Promise<TelegramSendOutcome> {
  const text = telegramMessageOfNotification(notification, callNoticeTitle);
  if (text === null) return { outcome: 'noContent' };
  const providerMessageId = await sendTelegramMessage({ token, chatId: destination, text });
  return { outcome: 'sent', providerMessageId };
}
