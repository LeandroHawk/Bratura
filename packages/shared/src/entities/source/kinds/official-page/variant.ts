import { z } from 'zod';
import { requiredString } from '../../../../primitives/code/string/fields';
import { ianaTimeZone } from '../../../../primitives/code/time/time-zone/fields';
import { requiredHttpsUrl } from '../../../../primitives/code/url/fields';
import { SourceAccessFields } from '../../fragments/access/fields';
import { SourceComplianceFields } from '../../fragments/compliance/fields';
import { SourceIdentityFields } from '../../fragments/identity/fields';

/**
 * Parts of a URL (`/fundacaocultural/`, `.pdf`, `?download=`) or of a link's text (`processo
 * seletivo de profissionais`): plain text, never a regex.
 */
const textParts = z.array(requiredString('short')).min(1).max(20);

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
    callPageUrlParts: textParts,
    /**
     * robots.txt's `Crawl-delay`, kept between the pages the reader fetches (UFU: 10); Firecrawl's
     * document reads keep their own spacing. At 30 s, the 5 min for call pages still opens 10.
     */
    crawlDelaySeconds: z.number().int().min(1).max(30).optional(),
    /**
     * The call page's own text is its notice when it links none (Badesc: rules in the post,
     * applications on a form). Without it, such a call is recorded with no document to read.
     */
    callPageIsTheNotice: z.boolean().optional(),
    /**
     * A call page is a call only when it links a notice: folders hold courses, plans and contracts
     * too (Palmas "Cursos de Iniciação Artística", Porto Velho "Termos de Inexigibilidade").
     * Without it, a page with no notice is still recorded, for the admin review.
     */
    callPageNeedsNotice: z.boolean().optional(),
    /**
     * The class of the element holding a call page's publication date ("17/10/2026 04:42"), where
     * the listing keeps years of news with no year in the title (Porto Alegre
     * `field--name-field-noticia-data-no-calendario`): a page published over a year ago is skipped.
     */
    callPagePublishedAtClass: cssClassName.optional(),
    /**
     * The class of the element naming the call on its page, where the `<h1>` names a form
     * (Itaperuna: `<h1>` "Formulário de Inscrição — …", `texto-secundario` "Edital de Chamamento
     * Público nº 01/2026 — …"). It takes the `<h1>`'s place wherever the page's heading is read.
     */
    callPageTitleClass: cssClassName.optional(),
    /**
     * The call is named by its page's heading (or `callPageTitleClass`), not by the listing's link:
     * cards link title, description and status as one text (Secult-RN Mais Cultura; FCP-PA
     * "Abertura: h Modalidade: Edital de Credenciamento Edital Semear 2026").
     */
    callTitleOnCallPage: z.boolean().optional(),
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
    /**
     * A call page holds folders, not files: the links below its own path are opened, one level, for
     * its documents (FJA-RN: "PUBLICAÇÕES CHAMADA 01_26" with the notice, "ANEXOS…" with forms).
     */
    callFilesInSubfolders: z.boolean().optional(),
    /**
     * The listing links one page per year, named by the year alone, and each year page links its
     * calls' pages (Erechim: "PNAB" → "2026" → "PNAB - Edital nº 04/2026"). This and last year's
     * are opened: the listing stays the same URL when a new year's page appears.
     */
    callPagesOnYearPages: z.boolean().optional(),
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
  /**
   * What a call's title contains (a call page's link text, a listed notice's), compared without
   * accents or case; other calls are skipped (headings: no source needs it yet). UFU lists 6 of 7
   * items for its students beside "Processo Seletivo de Profissionais"; Sesc RR, food vendors.
   */
  callTitleParts: textParts.optional(),
  /** What a document link contains; a link with none of them is not a document. */
  documentUrlParts: textParts,
  /** The site's zone: its dates ("até 20/11") carry none. */
  timeZone: ianaTimeZone,
});

export type OfficialPageSource = z.infer<typeof OfficialPageSourceSchema>;
