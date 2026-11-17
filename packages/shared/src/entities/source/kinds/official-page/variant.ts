import { z } from 'zod';
import { requiredString } from '../../../../primitives/code/string/fields';
import { ianaTimeZone } from '../../../../primitives/code/time/time-zone/fields';
import { requiredHttpsUrl } from '../../../../primitives/code/url/fields';
import { SourceAccessFields } from '../../fragments/access/fields';
import { SourceComplianceFields } from '../../fragments/compliance/fields';
import { SourceIdentityFields } from '../../fragments/identity/fields';

/** Parts of a URL (`/fundacaocultural/`, `.pdf`, `?download=`): plain text, never a regex. */
const urlParts = z.array(requiredString('short')).min(1).max(20);

/**
 * How the site reaches a call's documents. `callPage` (PR, BA, Rio): listing → one page per call →
 * its documents. `documentsOnListing` (MG, MA): the listing links every version and annex itself,
 * and only the link text says which call each belongs to. `documentsUnderHeadings` (Jundiaí,
 * Jaboatão): the listing links them under one heading per call, which names the call.
 */
export const OfficialPageDiscoverySchema = z.discriminatedUnion('hops', [
  z.object({
    hops: z.literal('callPage'),
    /** What a call page's URL contains; other links on the listing are skipped. */
    callPageUrlParts: urlParts,
  }),
  z.object({ hops: z.literal('documentsOnListing') }),
  z.object({ hops: z.literal('documentsUnderHeadings') }),
]);

/**
 * A government or agency site with no API (Bahia's FUNCEB, Rio's culture office): its listing
 * page is fetched as plain HTML, and Firecrawl reads only the documents.
 */
export const OfficialPageSourceSchema = z.object({
  kind: z.literal('officialPage'),
  ...SourceIdentityFields.shape,
  ...SourceComplianceFields.shape,
  ...SourceAccessFields.shape,
  /** The page where the site lists its calls. */
  listingUrl: requiredHttpsUrl,
  discovery: OfficialPageDiscoverySchema,
  /** What a document link contains; a link with none of them is not a document. */
  documentUrlParts: urlParts,
  /** The site's zone: its dates ("até 20/11") carry none. */
  timeZone: ianaTimeZone,
});

export type OfficialPageSource = z.infer<typeof OfficialPageSourceSchema>;
