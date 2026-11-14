import type { AlertChannel } from '@bratura/shared/entities/alert/enums/alert-channel/enum';
import type { AlertTemplate } from '@bratura/shared/entities/alert/enums/alert-template/enum';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { appError } from '../../lib/appError';
import { fetchNvoipAccessToken, sendNvoipTemplate } from '../nvoip/client';
import { templateLanguageFromLocale } from '../nvoip/templateLanguage';

/** The deployment's messaging settings, read by the caller from env (`lib/env.ts`). */
export type MessagingSettings = {
  clientId: string;
  clientSecret: string;
  whatsappInstance: string;
};

export type TemplateMessage = {
  channel: AlertChannel;
  template: AlertTemplate;
  destination: string;
  locale: Locale;
  variables: string[];
};

/**
 * The channel adapter (`docs/integrations/whatsapp.md`, How it fits the backend): picks the
 * provider a channel sends through. WhatsApp goes by Nvoip today and can move to the Cloud API
 * inside this function alone; e-mail joins with Resend. Returns the provider's message id when
 * it gives one.
 */
export async function sendTemplateMessage(
  { channel, template, destination, locale, variables }: TemplateMessage,
  settings: MessagingSettings,
): Promise<{ providerMessageId: string | null }> {
  if (channel !== 'whatsapp') throw appError({ code: 'unavailable' });
  const accessToken = await fetchNvoipAccessToken({
    clientId: settings.clientId,
    clientSecret: settings.clientSecret,
  });
  const providerMessageId = await sendNvoipTemplate({
    accessToken,
    templateId: template,
    destination,
    instance: settings.whatsappInstance,
    language: templateLanguageFromLocale(locale),
    bodyVariables: variables,
  });
  return { providerMessageId };
}
