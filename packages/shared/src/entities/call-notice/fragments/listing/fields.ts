import { z } from 'zod';
import { documentId } from '../../../../primitives/code/id/fields';
import { nullableString, requiredString } from '../../../../primitives/code/string/fields';
import { requiredHttpUrl } from '../../../../primitives/code/url/fields';

/** Text files only: a call notice and its annexes. Media and spreadsheets are not a document. */
const callNoticeDocumentExtensions = new Set(['pdf', 'doc', 'docx', 'odt', 'rtf']);

// Zod runs a refine even when `httpUrl` already failed, so an unparsable link must not throw here.
function hasDocumentExtension(url: string) {
  if (!URL.canParse(url)) return false;
  const { pathname, search } = new URL(url);
  const fileName = pathname.split('/').pop() ?? '';
  if (!fileName.includes('.')) return true;
  const extension = fileName.split('.').pop()!.toLowerCase();
  if (extension === 'php' && search) return true;
  return callNoticeDocumentExtensions.has(extension);
}

/**
 * A link to one of a call notice's text files. Ingestion filters a source's attachments with it.
 * A path with no extension passes, and a PHP script with a query: a download handler
 * (`/download/category/15?download=5059`, `edital_arquivo.php?id=94`) names the file only in its
 * answer.
 */
export const CallNoticeDocumentUrlSchema = requiredHttpUrl.refine(hasDocumentExtension, {
  params: { message: 'notADocument' },
});

/** One document's link with the text a person reads on it ("Edital FEC 02/2026 - Retificado"). */
export const CallNoticeDocumentLabelSchema = z.object({
  url: CallNoticeDocumentUrlSchema,
  label: requiredString('long'),
});

/** How many document links a call notice keeps (one federal call had 37). */
export const callNoticeDocumentUrlsMax = 50;

/**
 * Writes: `recordCallNotice` (backend `callNotices/mutations.ts`), on every read of the source.
 * Comes from: the source's listing — in brackets, the Mapas Culturais API field
 * (`opportunity/find`); for an official page, its listing and call pages, fetched as HTML.
 */
export const CallNoticeListingFields = z.object({
  sourceId: documentId('sources'),
  /** The source's own id for it [`id`; an official page's call page URL, or the call's number when
   * the listing links the documents]: unique per source. */
  externalId: requiredString('max'),
  /** [`name`] */
  title: requiredString('long'),
  /** [`shortDescription`]; `null` when the source gives none. */
  summary: nullableString(),
  /** The page a creator opens to read and apply [`singleUrl`]. */
  officialUrl: requiredHttpUrl,
  /** The text files the source attaches, in its order [`@files:rules` first, then
   * `@files:downloads`]: the call notice and its annexes, media left out. Which one is the call
   * notice is decided when documents are read. */
  documentUrls: z.array(CallNoticeDocumentUrlSchema).max(callNoticeDocumentUrlsMax),
  /** The text of each document's link, where the source gives one apart from the file name (an
   * official page: "Edital FEC 02/2026 - Retificado em 10/11/26"). Absent for Mapas Culturais. */
  documentLabels: z.array(CallNoticeDocumentLabelSchema).max(callNoticeDocumentUrlsMax).optional(),
  /** An official page posts a result for it (closed, often with no close printed). Absent for
   * Mapas Culturais. Feeds the tracking's `closedWhenFirstSeen`. */
  resultPosted: z.boolean().optional(),
});
