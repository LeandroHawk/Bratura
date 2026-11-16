import {
  CallNoticeDocumentUrlSchema,
  callNoticeDocumentUrlsMax,
} from '@bratura/shared/entities/call-notice/fragments/listing/fields';
import type { Id } from '../../_generated/dataModel';
import type { CallNoticeListingToRecord } from '../../callNotices';
import { cutToTextLength } from '../../lib/text';
import { zonedInstantFromMapasDate } from './date';
import type { MapasOpportunity } from './payload';

/** No summary rather than an empty one; past the contract's ceiling it is cut, not lost. */
function summaryFromShortDescription(text: string | null | undefined) {
  const summary = text?.trim();
  return summary ? cutToTextLength(summary, 'max') : null;
}

/** A Mapas opportunity in the call notice's terms: what `recordCallNotice` takes. */
export function callNoticeListingFromMapasOpportunity(
  sourceId: Id<'sources'>,
  opportunity: MapasOpportunity,
): CallNoticeListingToRecord {
  return {
    sourceId,
    externalId: String(opportunity.id),
    title: opportunity.name,
    summary: summaryFromShortDescription(opportunity.shortDescription),
    officialUrl: opportunity.singleUrl,
    documentUrls: [opportunity['@files:rules'], ...(opportunity['@files:downloads'] ?? [])]
      .flatMap((file) => (file ? [file.url] : []))
      .filter((url, index, urls) => urls.indexOf(url) === index)
      .filter((url) => CallNoticeDocumentUrlSchema.safeParse(url).success)
      .slice(0, callNoticeDocumentUrlsMax),
    registrationOpens: zonedInstantFromMapasDate(opportunity.registrationFrom),
    registrationCloses: zonedInstantFromMapasDate(opportunity.registrationTo),
  };
}
