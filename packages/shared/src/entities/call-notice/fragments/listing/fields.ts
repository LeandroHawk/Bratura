import { z } from 'zod';
import { documentId } from '../../../../primitives/code/id/fields';
import { nullableString, requiredString } from '../../../../primitives/code/string/fields';
import { requiredHttpUrl } from '../../../../primitives/code/url/fields';

/** Text files only: a call notice and its annexes. Media and spreadsheets are not a document. */
const callNoticeDocumentExtensions = new Set(['pdf', 'doc', 'docx', 'odt', 'rtf']);

// Zod runs a refine even when `httpUrl` already failed, so an unparsable link must not throw here.
function hasDocumentExtension(url: string) {
  if (!URL.canParse(url)) return false;
  const extension = new URL(url).pathname.split('.').pop()?.toLowerCase();
  return extension !== undefined && callNoticeDocumentExtensions.has(extension);
}

/** A link to one of a call notice's text files. Ingestion filters a source's attachments with it. */
export const CallNoticeDocumentUrlSchema = requiredHttpUrl.refine(hasDocumentExtension, {
  params: { message: 'notADocument' },
});

/** How many document links a call notice keeps (one federal call had 37). */
export const callNoticeDocumentUrlsMax = 50;

/**
 * Writes: `recordCallNotice` (backend `callNotices/mutations.ts`), on every read of the source.
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
  documentUrls: z.array(CallNoticeDocumentUrlSchema).max(callNoticeDocumentUrlsMax),
});
