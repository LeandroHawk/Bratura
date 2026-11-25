import type { SourceAccess } from '@bratura/shared/entities/source/fragments/access/fields';
import { plainDateInSaoPaulo } from '@bratura/shared/primitives/code/calendar/calendar';
import { fetchJsonListOnSourceHost } from '../sourceHost/fetchOnSourceHost';

/**
 * A Mapas instance that has not answered in this long is `unavailable` (SP Cultura took over 90 s).
 */
const mapasTimeoutMs = 60_000;
/**
 * Past this, no page of opportunities (Ceará's whole year in one answer was 1.55 MB, 2026-11-20).
 * Low on purpose: the body, its text and its parsed objects share the runtime's 64 MiB.
 */
const mapasMaxBytes = 2_000_000;
/** Opportunities per page: about 0.7 MB at Ceará's 2.6 kB each, well under `mapasMaxBytes`. */
export const mapasPageSize = 250;
/** Past this many full pages the instance is not what we measured (Ceará: 588 in 2026). */
const mapasMaxPages = 8;

/**
 * The opportunities open for registration on `now` (a São Paulo day) or closed since 1 January of
 * its year, as raw JSON, page by page until a short one: each is parsed by the caller, so one
 * malformed entry does not discard the others. One with no close is left out by Mapas itself (a
 * comparison with null), as before; an open-ended one carries a far close (2111) and comes. On the
 * instance's own host only (`fetchOnSourceHost`). Throws when a page fails as that does, and past
 * `mapasMaxPages`.
 */
export async function fetchMapasOpportunitiesClosingThisYearOrLater(
  baseUrl: string,
  now: number,
  access: SourceAccess = {},
): Promise<unknown[]> {
  const today = plainDateInSaoPaulo(now);
  const url = new URL('/api/opportunity/find', baseUrl);
  url.searchParams.set(
    '@select',
    'id,name,shortDescription,registrationFrom,registrationTo,singleUrl',
  );
  url.searchParams.set('@files', '(rules,downloads):url');
  url.searchParams.set('registrationFrom', `LTE(${today})`);
  url.searchParams.set('registrationTo', `GTE(${today.slice(0, 4)}-01-01)`);
  // The id breaks ties, so a page boundary between equal closes neither repeats nor skips one.
  url.searchParams.set('@order', 'registrationTo ASC,id ASC');
  url.searchParams.set('@limit', String(mapasPageSize));

  const opportunities: unknown[] = [];
  for (let page = 1; page <= mapasMaxPages; page++) {
    url.searchParams.set('@page', String(page));
    const entries = await fetchJsonListOnSourceHost(
      url.href,
      baseUrl,
      { timeoutMs: mapasTimeoutMs, maxBytes: mapasMaxBytes },
      access,
    );
    opportunities.push(...entries);
    if (entries.length < mapasPageSize) return opportunities;
  }
  throw new Error(`${new URL(baseUrl).host} listed over ${mapasMaxPages} pages of opportunities`);
}
