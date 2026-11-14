import { z } from 'zod';
import { documentId } from '../../../../primitives/code/id/fields';
import { requiredString } from '../../../../primitives/code/string/fields';
import { AlertTemplateEnum } from '../../enums/alert-template/enum';

/**
 * Writes: an alert's trigger (matching, the deadline cron, a changed call), through `alerts.ts`.
 * Comes from: the match or the window that fired it. This is the outbox's dedupe key — one alert
 * per creator × call notice × template × occurrence, so a reminder never goes twice. `occurrence`
 * is the writer's marker for which send of that template it is ('d7' of a closing window,
 * 'firstEligible' of a match, the date a call was amended).
 */
export const AlertIdentityFields = z.object({
  creatorId: documentId('creators'),
  callNoticeId: documentId('callNotices'),
  template: AlertTemplateEnum,
  occurrence: requiredString('short'),
});
