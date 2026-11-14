import {
  CallNoticeDocumentUrlSchema,
  callNoticeDocumentUrlsMax,
} from '@bratura/shared/entities/call-notice/fragments/listing/fields';
import { textLengths } from '@bratura/shared/primitives/code/string/fields';
import type { Id } from '../../_generated/dataModel';
import type { CallNoticeListingToRecord } from '../../callNotices';
import { zonedInstantFromMapasDate } from './date';
import type { MapasOpportunity } from './payload';

/**
 * A summary past the contract's ceiling is cut there and marked "…", instead of losing the call
 * notice: the full text stays on the official page, whose link is stored.
 */
function summaryFromShortDescription(text: string | null | undefined) {
  const summary = text?.trim();
  if (!summary) return null;
  return summary.length > textLengths.max ? `${summary.slice(0, textLengths.max - 1)}…` : summary;
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
    documentUrls: (opportunity['@files:downloads'] ?? [])
      .map((file) => file.url)
      .filter((url) => CallNoticeDocumentUrlSchema.safeParse(url).success)
      .slice(0, callNoticeDocumentUrlsMax),
    registrationOpens: zonedInstantFromMapasDate(opportunity.registrationFrom),
    registrationCloses: zonedInstantFromMapasDate(opportunity.registrationTo),
  };
}
