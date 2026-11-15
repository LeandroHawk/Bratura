import { callNoticeDocumentUrlsMax } from '@bratura/shared/entities/call-notice/fragments/listing/fields';
import { textLengths } from '@bratura/shared/primitives/code/string/fields';
import type { Id } from '../../_generated/dataModel';
import type { CallNoticeListingToRecord } from '../../callNotices';
import type { OfficialPageCall } from './payload';

/** A link text past the contract ceiling is cut and marked "…": it names, it is not the rules. */
const cutToLong = (text: string) =>
  text.length > textLengths.long ? `${text.slice(0, textLengths.long - 1)}…` : text;

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
    title: cutToLong(call.title),
    summary: null,
    officialUrl: call.officialUrl,
    documentUrls: documents.map(({ url }) => url),
    documentLabels: documents.flatMap(({ url, label }) =>
      label ? [{ url, label: cutToLong(label) }] : [],
    ),
    registrationOpens: null,
    registrationCloses: null,
  };
}
