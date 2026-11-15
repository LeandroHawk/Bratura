import { callNoticeDocumentUrlsMax } from '@bratura/shared/entities/call-notice/fragments/listing/fields';
import type { Id } from '../../_generated/dataModel';
import type { CallNoticeListingToRecord } from '../../callNotices';
import { cutToTextLength } from '../../lib/text';
import type { OfficialPageCall } from './payload';

/**
 * An official page's call in the call notice's terms. The page prints no window the reader can
 * trust (Bahia's dates are often the activity's), so both ends are `null` until extraction.
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
    registrationCloses: null,
  };
}
