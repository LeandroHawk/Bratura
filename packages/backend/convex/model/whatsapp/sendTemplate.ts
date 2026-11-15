import type { UserNotificationDraft } from '@bratura/shared/entities/user-notification/entity';
import { sendNvoipTemplate } from './nvoip/client';
import { whatsappTemplateOfNotification } from './templates';

export type WhatsAppTemplateSend = {
  /** A v3 access token; the caller fetches one per run, not per message. */
  accessToken: string;
  /** `NVOIP_WA_INSTANCE`, read by the caller from env. */
  whatsappInstance: string;
  notification: UserNotificationDraft;
  /** The stored call notice's title for kinds that name it; `null` when it is gone. */
  callNoticeTitle: string | null;
  /** The recipient's phone, resolved from `users` at send time — never stored in a table. */
  destination: string;
};

export type WhatsAppSendOutcome =
  | { outcome: 'sent'; providerMessageId: string | null }
  /** No template fits (a call-notice kind whose notice is gone): release the claim, do not fail. */
  | { outcome: 'noContent' };

/**
 * The only function the doors import for WhatsApp sends (`docs/integrations/whatsapp.md`): maps
 * the notification kind to its approved template and sends through Nvoip. The provider is
 * swappable inside `nvoip/` without touching the callers.
 */
export async function sendWhatsAppTemplate({
  accessToken,
  whatsappInstance,
  notification,
  callNoticeTitle,
  destination,
}: WhatsAppTemplateSend): Promise<WhatsAppSendOutcome> {
  const template = whatsappTemplateOfNotification(notification, callNoticeTitle);
  if (template === null) return { outcome: 'noContent' };
  const providerMessageId = await sendNvoipTemplate({
    accessToken,
    templateId: template.templateId,
    destination,
    instance: whatsappInstance,
    language: template.language,
    bodyVariables: template.bodyVariables,
  });
  return { outcome: 'sent', providerMessageId };
}
