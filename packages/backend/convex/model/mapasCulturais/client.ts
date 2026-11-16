import { plainDateInSaoPaulo } from '@bratura/shared/primitives/code/calendar/calendar';
import { fetchOnSourceHost } from '../sourceHost/fetchOnSourceHost';

/**
 * A Mapas instance that has not answered in this long is `unavailable` (SP Cultura took over 90 s).
 */
const mapasTimeoutMs = 60_000;
/**
 * Past this, no list of open calls (the largest measured, Pernambuco's, is 108 KB, 2026-11-15).
 * Low on purpose: the body, its text and its parsed objects share the runtime's 64 MiB.
 */
const mapasMaxBytes = 2_000_000;

/**
 * The opportunities whose registration is open on `now` (a São Paulo day), as raw JSON: each is
 * parsed by the caller, so one malformed entry does not discard the others. On the instance's
 * own host only (`fetchOnSourceHost`). Throws when the instance does not answer, redirects off its
 * host, answers an error, something other than JSON, more than `mapasMaxBytes`, or no list.
 */
export async function fetchOpenMapasOpportunities(
  baseUrl: string,
  now: number,
): Promise<unknown[]> {
  const today = plainDateInSaoPaulo(now);
  const url = new URL('/api/opportunity/find', baseUrl);
  url.searchParams.set(
    '@select',
    'id,name,shortDescription,registrationFrom,registrationTo,singleUrl',
  );
  url.searchParams.set('@files', '(downloads):url');
  url.searchParams.set('registrationFrom', `LTE(${today})`);
  url.searchParams.set('registrationTo', `GTE(${today})`);
  url.searchParams.set('@order', 'registrationTo ASC');

  const answer = await fetchOnSourceHost(url.href, baseUrl, {
    accept: 'application/json',
    isExpectedType: (type) => type.includes('json'),
    timeoutMs: mapasTimeoutMs,
    maxBytes: mapasMaxBytes,
  });
  const body: unknown = JSON.parse(new TextDecoder().decode(answer.body));
  if (!Array.isArray(body)) throw new Error(`${url.host} did not answer a list`);
  return body;
}
