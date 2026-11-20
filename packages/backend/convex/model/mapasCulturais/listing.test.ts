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

  test('keeps a call that closed before it was listed: the year counts every call', () => {
    const registrationTo = { date: '2026-01-10 23:59:00.000000', timezone: 'Etc/GMT+3' };
    const registrationFrom = { date: '2026-01-02 00:01:00.000000', timezone: 'Etc/GMT+3' };
    expect(listingOf({ registrationFrom, registrationTo })).toMatchObject({
      externalId: '4321',
      registrationCloses: { at: Date.UTC(2026, 0, 11, 2, 59) },
    });
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

  test('puts the notice Mapas names "Regulamento" first, even with no downloads', () => {
    const rules = { url: 'https://cultura.cianorte.pr.gov.br/files/opportunity/106/edital-11.pdf' };
    expect(
      listingOf({ '@files:rules': rules, '@files:downloads': undefined }).documentUrls,
    ).toEqual([rules.url]);
    expect(listingOf({ '@files:rules': rules }).documentUrls).toEqual([
      rules.url,
      'https://mapa.cultura.gov.br/files/opportunity/4321/edital.pdf',
      'https://mapa.cultura.gov.br/files/opportunity/4321/anexo-i.DOCX',
    ]);
  });

  test('keeps a file sent both as the notice and as a download once', () => {
    const rules = { url: 'https://mapa.cultura.gov.br/files/opportunity/4321/edital.pdf' };
    expect(listingOf({ '@files:rules': rules }).documentUrls).toEqual([
      rules.url,
      'https://mapa.cultura.gov.br/files/opportunity/4321/anexo-i.DOCX',
    ]);
  });

  test("drops a file uploaded again under its name (`-2`, `-3`), never a `-1`, a `-05` or another folder's", () => {
    const folder = 'https://mapacultural.parauapebas.pa.gov.br/files/opportunity/161';
    const downloads = [
      `${folder}/edital-ass.pdf`,
      `${folder}/edital-ass-2.pdf`,
      `${folder}/edital-ass-3.pdf`,
      `${folder}/anexo.pdf`,
      `${folder}/anexo-1.pdf`,
      `${folder}/anexo-05.pdf`,
      `${folder}/categorias-2.pdf`,
      `${folder}/edital-ass-2.docx`,
      'https://mapacultural.parauapebas.pa.gov.br/files/opportunity/162/edital-ass-2.pdf',
    ].map((url) => ({ url }));
    expect(listingOf({ '@files:downloads': downloads }).documentUrls).toEqual([
      `${folder}/edital-ass.pdf`,
      `${folder}/anexo.pdf`,
      `${folder}/anexo-1.pdf`,
      `${folder}/anexo-05.pdf`,
      `${folder}/categorias-2.pdf`,
      `${folder}/edital-ass-2.docx`,
      'https://mapacultural.parauapebas.pa.gov.br/files/opportunity/162/edital-ass-2.pdf',
    ]);
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
