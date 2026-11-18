import { z } from 'zod';
import { requiredString } from '../../../../primitives/code/string/fields';
import { ianaTimeZone } from '../../../../primitives/code/time/time-zone/fields';
import { requiredHttpsUrl } from '../../../../primitives/code/url/fields';
import { SourceAccessFields } from '../../fragments/access/fields';
import { SourceComplianceFields } from '../../fragments/compliance/fields';
import { SourceIdentityFields } from '../../fragments/identity/fields';

/** Parts of a URL (`/fundacaocultural/`, `.pdf`, `?download=`): plain text, never a regex. */
const urlParts = z.array(requiredString('short')).min(1).max(20);

/** One HTML class name (`accordion-toggle`): the reader matches it as a whole word. */
const cssClassName = requiredString('short').regex(/^[A-Za-z_][\w-]*$/);

/**
 * How the site reaches a call's documents. `callPage` (PR, BA, Rio; Rio Branco from a JSON
 * listing, Porto Velho from year folders): listing → one page per call → its documents.
 * `documentsOnListing` (MG, MA): the listing links every version and annex itself, and only the
 * link text says which call each belongs to. `documentsUnderHeadings` (Jundiaí, Jaboatão): the
 * listing links them under one heading per call, which names the call.
 */
export const OfficialPageDiscoverySchema = z.discriminatedUnion('hops', [
  z.object({
    hops: z.literal('callPage'),
    /** What a call page's URL contains; other links on the listing are skipped. */
    callPageUrlParts: urlParts,
    /**
     * The call page's own text is its notice when it links none (Badesc: rules in the post,
     * applications on a form). Without it, such a call is recorded with no document to read.
     */
    callPageIsTheNotice: z.boolean().optional(),
    /**
     * The class of the element holding a call page's publication date ("17/10/2026 04:42"), where
     * the listing keeps years of news with no year in the title (Porto Alegre
     * `field--name-field-noticia-data-no-calendario`): a page published over a year ago is skipped.
     */
    callPagePublishedAtClass: cssClassName.optional(),
    /**
     * The listing is a JSON list of calls, not links (Rio Branco: an Alpine template filled from
     * `/admin/editais/edital-listar-json`). Each item's call page is `callPagePath` on the
     * listing's host (a path, never `//host`) with `{id}` replaced by the item's `id`, its link
     * text the item's `titleField`.
     */
    callPagesListedAsJson: z
      .object({
        callPagePath: requiredString('short').regex(/^\/(?!\/)\S*\{id\}\S*$/),
        titleField: requiredString('short'),
      })
      .optional(),
    /**
     * Calls filed as folders a button opens, not a link (Porto Velho, a Livewire file manager:
     * `wire:click="selectFolder(N)"`, served at `?folder=N`): the listing holds one folder per
     * year, named by it, which holds one per call; a call's files sit in its folder or one below.
     */
    callsFiledInYearFolders: z.boolean().optional(),
  }),
  z.object({ hops: z.literal('documentsOnListing') }),
  z.object({
    hops: z.literal('documentsUnderHeadings'),
    /**
     * The class of the element that titles each call when the page uses no `<h1-6>` for it
     * (accordions: Recife `accordion-toggle`, Spcine `x-acc-header`). `<h1-6>` still count.
     */
    headingClass: cssClassName.optional(),
  }),
]);

/**
 * A government or agency site with no API (Bahia's FUNCEB, Rio's culture office): its listing
 * page is fetched as plain HTML (or the JSON a page fills itself from, `callPagesListedAsJson`),
 * and Firecrawl reads only the documents.
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
