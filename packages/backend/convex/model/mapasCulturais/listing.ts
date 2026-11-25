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

/** A file URL as its folder, name stem and extension: `…/161/`, `edital-ass-2`, `.pdf`. */
function fileParts(url: string) {
  const slash = url.lastIndexOf('/');
  const name = url.slice(slash + 1);
  const dot = name.lastIndexOf('.');
  return dot > 0
    ? { folder: url.slice(0, slash + 1), stem: name.slice(0, dot), extension: name.slice(dot) }
    : { folder: url.slice(0, slash + 1), stem: name, extension: '' };
}

/**
 * Each file once, in the source's order: the notice Mapas also lists as a download, and a file
 * uploaded again under a name its opportunity already holds, which Mapas saves as `name-2.pdf`,
 * `name-3.pdf`: byte for byte the same file (28 of 28 such pairs in the dev DB, 2026-11-17), each
 * paid again (433 credits, 8% of all reads). A `-N` name whose `name` sits in the same folder goes.
 */
function eachFileOnce(urls: string[]) {
  const known = new Set(urls);
  return [...known].filter((url) => {
    const { folder, stem, extension } = fileParts(url);
    const repeated = /^(.+)-([2-9]|[1-9]\d+)$/.exec(stem);
    return !repeated || !known.has(`${folder}${repeated[1]}${extension}`);
  });
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
    documentUrls: eachFileOnce(
      [opportunity['@files:rules'], ...(opportunity['@files:downloads'] ?? [])]
        .flatMap((file) => (file ? [file.url] : []))
        .filter((url) => CallNoticeDocumentUrlSchema.safeParse(url).success),
    ).slice(0, callNoticeDocumentUrlsMax),
    registrationOpens: zonedInstantFromMapasDate(opportunity.registrationFrom),
    registrationCloses: zonedInstantFromMapasDate(opportunity.registrationTo),
  };
}
