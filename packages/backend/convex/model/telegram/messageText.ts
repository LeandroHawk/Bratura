import type { UserNotificationDraft } from '@bratura/shared/entities/user-notification/entity';

// `callNoticeTitle` is resolved at send time; a kind that needs it gets no message when the call
// notice is gone, rather than a message without its subject. Telegram takes free text, so an
// announcement sends its whole body — the web renders the same fields from its own copy. No
// "/parar" hint yet: the command has no entry until the inbound webhook exists.

/**
 * The pt-BR text a notification sends by Telegram, or `null` when there is nothing to say. The
 * notification row stores parameters only; each channel renders its own copy.
 */
export function telegramMessageOfNotification(
  notification: UserNotificationDraft,
  callNoticeTitle: string | null,
): string | null {
  if (notification.kind === 'platformAnnouncement')
    return `${notification.title.ptBR}\n\n${notification.body.ptBR}`;
  if (callNoticeTitle === null) return null;
  switch (notification.kind) {
    case 'newEligibleCall':
      return notification.matchStatus === 'eligible'
        ? `Um novo edital compatível com o seu portfólio foi publicado: ${callNoticeTitle}. Veja os detalhes na Bratura.`
        : `Um edital recém-publicado quase combina com o seu portfólio: ${callNoticeTitle}. Veja na Bratura o que falta para se inscrever.`;
    case 'deadlineSoon':
      return notification.occurrence === 'd7'
        ? `Atenção: faltam 7 dias para o fim das inscrições do edital ${callNoticeTitle}. Não perca o prazo — acesse a Bratura.`
        : `Atenção: as inscrições do edital ${callNoticeTitle} encerram amanhã. Não perca o prazo — acesse a Bratura.`;
    case 'callNoticeAmended':
      return `O edital ${callNoticeTitle} foi retificado. Veja o que mudou na Bratura.`;
  }
}
