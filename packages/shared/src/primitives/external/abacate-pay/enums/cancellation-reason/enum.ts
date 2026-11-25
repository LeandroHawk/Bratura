import { z } from 'zod';

/**
 * Why a subscription ended, in our own values. The provider sends free text ("Cancelada pelo
 * cliente no portal: <reason the payer typed>") that can carry personal data, so the webhook
 * maps it at the edge and only this enum ever reaches a table or a log.
 */
export const CancellationReasonEnum = z.enum([
  'customerPortal',
  'customerRefund',
  'maxPaymentRetriesExceeded',
  'disputeOpened',
  'pixAuthorizationRefused',
  'accountClosed',
  'cancelledByBratura',
  'other',
]);

export type CancellationReason = z.infer<typeof CancellationReasonEnum>;
