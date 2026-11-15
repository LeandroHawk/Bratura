import type { UserNotificationDraft } from '@bratura/shared/entities/user-notification/entity';
import type { NvoipTemplateLanguage } from './nvoip/payload';

/**
 * A Meta-approved template as Nvoip sends it: its name, its approved language and the positional
 * values of its placeholders, in order. The language is the template's, not the user's locale —
 * sending `en_US` fails while only `pt_BR` is approved.
 */
export type WhatsAppTemplate = {
  templateId: string;
  language: NvoipTemplateLanguage;
  bodyVariables: string[];
};

/**
 * Which approved template each notification kind sends, and the variables its placeholders take
 * (`docs/integrations/whatsapp.md`, Templates). `callNoticeTitle` is resolved at send time; a
 * kind that needs it gets no template when the call notice is gone, rather than a message
 * without its subject.
 */
export function whatsappTemplateOfNotification(
  notification: UserNotificationDraft,
  callNoticeTitle: string | null,
): WhatsAppTemplate | null {
  if (notification.kind === 'platformAnnouncement') {
    const variables: [title: string] = [notification.title.ptBR];
    return { templateId: 'comunicado_plataforma', language: 'pt_BR', bodyVariables: variables };
  }
  if (callNoticeTitle === null) return null;
  switch (notification.kind) {
    case 'newEligibleCall': {
      const variables: [callNoticeTitle: string] = [callNoticeTitle];
      return {
        templateId:
          notification.matchStatus === 'eligible' ? 'edital_compativel' : 'quase_elegivel',
        language: 'pt_BR',
        bodyVariables: variables,
      };
    }
    case 'deadlineSoon': {
      const variables: [callNoticeTitle: string, daysLeft: string] = [
        callNoticeTitle,
        notification.occurrence === 'd7' ? '7' : '1',
      ];
      return { templateId: 'prazo_chegando', language: 'pt_BR', bodyVariables: variables };
    }
    case 'callNoticeAmended': {
      const variables: [callNoticeTitle: string] = [callNoticeTitle];
      return { templateId: 'edital_retificado', language: 'pt_BR', bodyVariables: variables };
    }
  }
}
