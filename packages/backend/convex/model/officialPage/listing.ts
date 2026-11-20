import { callNoticeDocumentUrlsMax } from '@bratura/shared/entities/call-notice/fragments/listing/fields';
import type { Id } from '../../_generated/dataModel';
import type { CallNoticeListingToRecord } from '../../callNotices';
import { cutToTextLength } from '../../lib/text';
import type { OfficialPageCall } from './payload';

/**
 * An official page's call in the call notice's terms. Only the close is read from the page, from a
 * registration sentence ("inscrições … até"): its other dates are often the activity's (Bahia), and
 * no page measured printed an opening apart from its close.
 */
export function callNoticeListingFromOfficialPageCall(
  sourceId: Id<'sources'>,
  call: OfficialPageCall,
): CallNoticeListingToRecord {
  const documents = call.documents.slice(0, callNoticeDocumentUrlsMax);
  return {
    sourceId,
    externalId: call.externalId,
    title: cutToTextLength(call.title, 'long'),
    summary: null,
    officialUrl: call.officialUrl,
    documentUrls: documents.map(({ url }) => url),
    documentLabels: documents.flatMap(({ url, label }) =>
      label ? [{ url, label: cutToTextLength(label, 'long') }] : [],
    ),
    registrationOpens: null,
    registrationCloses: call.registrationCloses,
  };
}
