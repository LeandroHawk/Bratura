import {
  CallNoticeDocumentLabelSchema,
  CallNoticeListingFields,
} from '@bratura/shared/entities/call-notice/fragments/listing/fields';
import { CallNoticeRegistrationWindowFields } from '@bratura/shared/entities/call-notice/fragments/registration-window/fields';
import { z } from 'zod';

/**
 * One call as the reader found it on an official page: built by our code from HTML, parsed again
 * at the edge (`SourceReader`): a page that broke the reader's assumptions is counted, not stored.
 * The link texts stay as the page has them: the listing cuts them and drops empty ones. The close
 * is the one the page prints (`registrationClosePrintedIn`), `null` when it prints none.
 */
export const OfficialPageCallSchema = CallNoticeListingFields.pick({
  externalId: true,
  officialUrl: true,
})
  .extend({
    title: z.string(),
    documents: z.array(CallNoticeDocumentLabelSchema.extend({ label: z.string() })),
  })
  .extend(CallNoticeRegistrationWindowFields.pick({ registrationCloses: true }).shape);
export type OfficialPageCall = z.infer<typeof OfficialPageCallSchema>;

/**
 * One item of a JSON listing (`callPagesListedAsJson`): its id and, under the source's
 * `titleField`, its title. An item without both is skipped, not the listing.
 */
export const JsonListedCallSchema = z.looseObject({
  id: z.union([z.number().int(), z.string().trim().min(1)]),
});

/**
 * A gov.br Volto page's embedded state (`window.__data`): the listing block's items
 * (`querystringsearch.subrequests`), a folder's items and the page's text blocks. IPHAN and Museu
 * do Índio (2026-11-18) print neither their listing nor their files as `<a>`: only here.
 */
export const VoltoStateSchema = z.looseObject({
  content: z
    .looseObject({
      data: z
        .looseObject({
          items: z.array(z.unknown()).optional(),
          blocks: z.record(z.string(), z.unknown()).optional(),
        })
        .nullish(),
    })
    .nullish(),
  querystringsearch: z
    .looseObject({
      subrequests: z.record(z.string(), z.looseObject({ items: z.array(z.unknown()) })).optional(),
    })
    .nullish(),
});

/**
 * A listed item: its absolute URL is `getURL` (IPHAN's listing block, whose `@id` is a path
 * without the agency) or `@id` (Museu do Índio's folder items).
 */
export const VoltoListedItemSchema = z.looseObject({
  title: z.string(),
  getURL: z.string().nullish(),
  '@id': z.string().nullish(),
});

/** A link in a text block: `{ type: 'link', data: { url }, children: [{ text }] }`. */
export const VoltoTextLinkSchema = z.looseObject({
  type: z.literal('link'),
  data: z.looseObject({ url: z.string() }),
  children: z.array(z.unknown()),
});
