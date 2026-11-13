import { z } from 'zod';
import { documentId } from '../../../../primitives/code/id/fields';
import { nullableString, requiredString } from '../../../../primitives/code/string/fields';
import { requiredHttpUrl } from '../../../../primitives/code/url/fields';

/**
 * Writes: `recordCallNotice` (backend `ingestion/callNotices.ts`), on every read of the source.
 * Comes from: the source's listing — in brackets, the Mapas Culturais API field
 * (`opportunity/find`); for an official page, the page Firecrawl read.
 */
export const CallNoticeListingFields = z.object({
  sourceId: documentId('sources'),
  /** The source's own id for it [`id`; the page URL for an official page]: unique per source. */
  externalId: requiredString('max'),
  /** [`name`] */
  title: requiredString('long'),
  /** [`shortDescription`]; `null` when the source gives none. */
  summary: nullableString(),
  /** The page a creator opens to read and apply [`singleUrl`]. */
  officialUrl: requiredHttpUrl,
  /** The call notice's document, usually a PDF [`@files:downloads[0].url`]: eligibility, amounts and
   * required documents live only there. `null` when the source links none. */
  documentUrl: requiredHttpUrl.nullable(),
});
