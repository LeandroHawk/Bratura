import type { Source } from '@bratura/shared/entities/source/entity';
import { ianaTimeZone } from '@bratura/shared/primitives/code/time/time-zone/fields';

/** The federal Mapas Culturais instance, as the team registered it on 2026-11-07. */
export const federalMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-federal',
  name: 'Mapas Culturais — Federal',
  isActive: true,
  robotsCheckedOn: '2026-11-07',
  termsCheckedOn: '2026-11-07',
  baseUrl: 'https://mapa.cultura.gov.br',
} satisfies Source;

/**
 * Bahia's FUNCEB: one page per call, linked from its 2026 listing (measured 2026-11-15). The
 * training centre's calls are `/fundacaocultural/centro-de-formacao-em-artes-convocatoria-…`.
 */
export const bahiaFuncebSource = {
  kind: 'officialPage',
  slug: 'ba-funceb',
  name: 'Fundação Cultural do Estado da Bahia — editais 2026',
  isActive: true,
  robotsCheckedOn: '2026-11-15',
  termsCheckedOn: '2026-11-15',
  listingUrl: 'https://www.ba.gov.br/fundacaocultural/editais-2026',
  discovery: {
    hops: 'callPage',
    callPageUrlParts: [
      '/fundacaocultural/edital',
      '/fundacaocultural/funcebedital',
      '/fundacaocultural/selecao',
      'convocatoria',
    ],
  },
  documentUrlParts: ['/sites/site-funceb/files/'],
  timeZone: ianaTimeZone.parse('America/Bahia'),
} satisfies Source;

/** Maranhão's Secma: the listing links every call's documents itself (measured 2026-11-15). */
export const maranhaoSecmaSource = {
  kind: 'officialPage',
  slug: 'ma-secma',
  name: 'Secma — editais',
  isActive: true,
  robotsCheckedOn: '2026-11-15',
  termsCheckedOn: '2026-11-15',
  listingUrl: 'https://cultura.ma.gov.br/programas-ou-campanhas/editais-secma',
  discovery: { hops: 'documentsOnListing' },
  documentUrlParts: ['/uploads/secma/docs/'],
  timeZone: ianaTimeZone.parse('America/Fortaleza'),
} satisfies Source;

/** Paraná's Seec: its home links one page per call, `/Pagina/Edital-…` (measured 2026-11-15). */
export const paranaSeecSource = {
  kind: 'officialPage',
  slug: 'pr-seec',
  name: 'Secretaria de Estado da Cultura do Paraná — editais',
  isActive: true,
  robotsCheckedOn: '2026-11-15',
  termsCheckedOn: '2026-11-15',
  listingUrl: 'https://www.cultura.pr.gov.br/',
  discovery: { hops: 'callPage', callPageUrlParts: ['/Pagina/Edital-', '/Pagina/EDITAL-'] },
  documentUrlParts: ['/arquivos_restritos/files/documento/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Funarte's yearly folder: one page per call, the year in the path, so the listing moves each
 * January (measured 2026-11-15). Not `/fomento/chamadas-abertas`: its links 302 to paths that 404.
 */
export const funarteCallsSource = {
  kind: 'officialPage',
  slug: 'funarte-chamadas',
  name: 'Funarte — chamadas 2026',
  isActive: true,
  robotsCheckedOn: '2026-11-15',
  termsCheckedOn: '2026-11-15',
  listingUrl: 'https://www.gov.br/funarte/pt-br/fomento/chamadas-2026',
  discovery: { hops: 'callPage', callPageUrlParts: ['/funarte/pt-br/fomento/chamadas-2026/'] },
  documentUrlParts: ['.pdf', '.docx'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/** Funarte Memória das Artes: a folder of calls one level below the yearly one (2026-11-15). */
export const funarteMemoryOfTheArtsSource = {
  ...funarteCallsSource,
  slug: 'funarte-memoria-das-artes',
  name: 'Funarte — Programa Memória das Artes 2026',
  listingUrl:
    'https://www.gov.br/funarte/pt-br/fomento/chamadas-2026/programa-funarte-memoria-das-artes',
  discovery: {
    hops: 'callPage',
    callPageUrlParts: ['/chamadas-2026/programa-funarte-memoria-das-artes/'],
  },
} satisfies Source;
