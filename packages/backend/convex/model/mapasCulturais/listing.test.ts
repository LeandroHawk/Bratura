import { textLengths } from '@bratura/shared/primitives/code/string/fields';
import { describe, expect, test } from 'vitest';
import type { Id } from '../../_generated/dataModel';
import { callNoticeListingFromMapasOpportunity } from './listing';
import { mapasOpportunity } from './mapasOpportunity.fixture';
import { MapasOpportunitySchema } from './payload';

const sourceId = 'source-id' as Id<'sources'>;
const listingOf = (overrides: Record<string, unknown> = {}) =>
  callNoticeListingFromMapasOpportunity(
    sourceId,
    MapasOpportunitySchema.parse(mapasOpportunity(overrides)),
  );

describe('callNoticeListingFromMapasOpportunity', () => {
  test('reads the time in the zone Mapas sent: Etc/GMT+3 is UTC−3', () => {
    expect(listingOf().registrationCloses).toEqual({
      at: Date.UTC(2026, 10, 16, 2, 59),
      timeZone: 'Etc/GMT+3',
      precision: 'minute',
    });
  });

  test.each([
    ['America/Fortaleza', Date.UTC(2026, 10, 16, 2, 59)],
    ['America/Recife', Date.UTC(2026, 10, 16, 2, 59)],
    ['America/Manaus', Date.UTC(2026, 10, 16, 3, 59)],
    ['America/Rio_Branco', Date.UTC(2026, 10, 16, 4, 59)],
  ])('reads 15/11 23:59 in %s', (timezone, at) => {
    const registrationTo = { date: '2026-11-15 23:59:00.000000', timezone };
    expect(listingOf({ registrationTo }).registrationCloses?.at).toBe(at);
  });

  test('keeps midnight as 00:00 of that day, the minute Mapas closes its form', () => {
    const registrationTo = { date: '2026-11-15 00:00:00.000000', timezone: 'Etc/GMT+3' };
    expect(listingOf({ registrationTo }).registrationCloses?.at).toBe(Date.UTC(2026, 10, 15, 3));
  });

  test('keeps text attachments in the source order and leaves media out', () => {
    expect(listingOf().documentUrls).toEqual([
      'https://mapa.cultura.gov.br/files/opportunity/4321/edital.pdf',
      'https://mapa.cultura.gov.br/files/opportunity/4321/anexo-i.DOCX',
    ]);
  });

  test('gives an empty list when Mapas sends no downloads', () => {
    expect(listingOf({ '@files:downloads': undefined }).documentUrls).toEqual([]);
  });

  test('cuts a summary past the ceiling and marks the cut', () => {
    const summary = listingOf({ shortDescription: 'a'.repeat(textLengths.max + 753) }).summary;
    expect(summary).toHaveLength(textLengths.max);
    expect(summary?.endsWith('…')).toBe(true);
  });

  test('stores no summary rather than an empty one', () => {
    expect(listingOf({ shortDescription: '   ' }).summary).toBeNull();
  });

  test('leaves a window end the source does not give as null', () => {
    expect(listingOf({ registrationFrom: null }).registrationOpens).toBeNull();
  });

  test('uses the Mapas id as the external id', () => {
    expect(listingOf().externalId).toBe('4321');
  });
});
