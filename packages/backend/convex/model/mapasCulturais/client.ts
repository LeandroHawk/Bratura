import { plainDateInSaoPaulo } from '@bratura/shared/primitives/code/calendar/calendar';

/** A Mapas instance that has not answered in this long is `unavailable` (SP Cultura took over 90 s). */
const mapasTimeoutMs = 60_000;

/**
 * The opportunities whose registration is open on `now` (a São Paulo day), as raw JSON: each is
 * parsed by the caller, so one malformed entry does not discard the others. Throws when the
 * instance does not answer, answers an error, or answers something other than a list.
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

  const response = await fetch(url, { signal: AbortSignal.timeout(mapasTimeoutMs) });
  if (!response.ok) throw new Error(`${url.host} answered HTTP ${response.status}`);
  const body: unknown = await response.json();
  if (!Array.isArray(body)) throw new Error(`${url.host} did not answer a list`);
  return body;
}
