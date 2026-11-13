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
  /** The text files the source attaches, in its order [`@files:downloads`]: the call notice and its
   * annexes, media left out. Which one is the call notice is decided when documents are read. */
  documentUrls: z.array(requiredHttpUrl).max(50),
});
