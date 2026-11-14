import { z } from 'zod';
import { documentId } from '../../../../primitives/code/id/fields';
import { CallNoticeDocumentUrlSchema } from '../../../call-notice/fragments/listing/fields';

/**
 * What a document is to its call, from its file name: the call notice itself, an amendment (moves
 * deadlines), the categories and amounts per project, or how proposals and portfolios are scored.
 */
export const CallNoticeDocumentRoleEnum = z.enum([
  'callNotice',
  'amendment',
  'categories',
  'criteria',
]);
export type CallNoticeDocumentRole = z.infer<typeof CallNoticeDocumentRoleEnum>;

/**
 * Writes: `documents.ts`, when it reserves a document. Comes from: the call's listing (one of its
 * `documentUrls`) and the file-name rules. Which document, in every status: listed, read, failed.
 */
export const CallNoticeDocumentIdentityFields = z.object({
  callNoticeId: documentId('callNotices'),
  /** One of the call's `documentUrls`; with `callNoticeId`, the natural key: never read twice. */
  url: CallNoticeDocumentUrlSchema,
  role: CallNoticeDocumentRoleEnum,
});
