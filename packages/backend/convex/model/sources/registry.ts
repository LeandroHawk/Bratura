import type { Source } from '@bratura/shared/entities/source/entity';
import { ianaTimeZone } from '@bratura/shared/primitives/code/time/time-zone/fields';

// Every source the team has checked (robots.txt and terms read, days recorded), written once:
// `sources:registerSource` copies one into the table and tests seed from here. A source added by
// hand elsewhere would drift from this file with nothing to notice.

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

export const canindeMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-caninde',
  name: 'Mapas Culturais — Canindé',
  isActive: true,
  robotsCheckedOn: '2026-11-13',
  termsCheckedOn: '2026-11-13',
  baseUrl: 'https://mapacultural.caninde.ce.gov.br',
} satisfies Source;

export const cearaMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-ce',
  name: 'Mapas Culturais — Ceará',
  isActive: true,
  robotsCheckedOn: '2026-11-13',
  termsCheckedOn: '2026-11-13',
  baseUrl: 'https://mapacultural.secult.ce.gov.br',
} satisfies Source;

/** Off: it times out from Convex (US East) and answers from Brazil (`docs/data-sources.md`). */
export const pernambucoMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-pe',
  name: 'Mapas Culturais — Pernambuco',
  isActive: false,
  robotsCheckedOn: '2026-11-13',
  termsCheckedOn: '2026-11-13',
  baseUrl: 'https://mapacultural.pe.gov.br',
} satisfies Source;

export const santoAndreMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-santo-andre',
  name: 'Mapas Culturais — Santo André',
  isActive: true,
  robotsCheckedOn: '2026-11-13',
  termsCheckedOn: '2026-11-13',
  baseUrl: 'https://culturaz.santoandre.sp.gov.br',
} satisfies Source;

export const aparecidaDeGoianiaMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-aparecida-de-goiania',
  name: 'Mapas Culturais — Aparecida de Goiânia',
  isActive: true,
  robotsCheckedOn: '2026-11-14',
  termsCheckedOn: '2026-11-14',
  baseUrl: 'https://portaldacultura.aparecida.go.gov.br',
} satisfies Source;

export const cimAmfriMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-cim-amfri',
  name: 'Mapas Culturais — CIM-AMFRI (SC)',
  isActive: true,
  robotsCheckedOn: '2026-11-14',
  termsCheckedOn: '2026-11-14',
  baseUrl: 'https://mapacultural.cim-amfri.sc.gov.br',
} satisfies Source;

export const espiritoSantoMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-es',
  name: 'Mapas Culturais — Espírito Santo',
  isActive: true,
  robotsCheckedOn: '2026-11-14',
  termsCheckedOn: '2026-11-14',
  baseUrl: 'https://mapa.cultura.es.gov.br',
} satisfies Source;

export const joaoPessoaMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-joao-pessoa',
  name: 'Mapas Culturais — João Pessoa',
  isActive: true,
  robotsCheckedOn: '2026-11-14',
  termsCheckedOn: '2026-11-14',
  baseUrl: 'https://jpcultura.joaopessoa.pb.gov.br',
} satisfies Source;

export const mauaMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-maua',
  name: 'Mapas Culturais — Mauá',
  isActive: true,
  robotsCheckedOn: '2026-11-14',
  termsCheckedOn: '2026-11-14',
  baseUrl: 'https://mapacultural.maua.sp.gov.br',
} satisfies Source;

export const natalMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-natal',
  name: 'Mapas Culturais — Natal',
  isActive: true,
  robotsCheckedOn: '2026-11-14',
  termsCheckedOn: '2026-11-14',
  baseUrl: 'https://mapacultural.natal.rn.gov.br',
} satisfies Source;

export const novaLimaMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-nova-lima',
  name: 'Mapas Culturais — Nova Lima',
  isActive: true,
  robotsCheckedOn: '2026-11-14',
  termsCheckedOn: '2026-11-14',
  baseUrl: 'https://mapacultural.novalima.mg.gov.br',
} satisfies Source;

export const parauapebasMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-parauapebas',
  name: 'Mapas Culturais — Parauapebas',
  isActive: true,
  robotsCheckedOn: '2026-11-14',
  termsCheckedOn: '2026-11-14',
  baseUrl: 'https://mapacultural.parauapebas.pa.gov.br',
} satisfies Source;

export const paraibaMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-pb',
  name: 'Mapas Culturais — Paraíba',
  isActive: true,
  robotsCheckedOn: '2026-11-14',
  termsCheckedOn: '2026-11-14',
  baseUrl: 'https://mapacultural.pb.gov.br',
} satisfies Source;

/** Times out from Convex (US East), as Pernambuco, but still on (`docs/data-sources.md`). */
export const sergipeMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-se',
  name: 'Mapas Culturais — Sergipe',
  isActive: true,
  robotsCheckedOn: '2026-11-14',
  termsCheckedOn: '2026-11-14',
  baseUrl: 'https://mapacultural.se.gov.br',
} satisfies Source;

export const anapolisMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-anapolis',
  name: 'Mapas Culturais — Anápolis',
  isActive: true,
  robotsCheckedOn: '2026-11-15',
  termsCheckedOn: '2026-11-15',
  baseUrl: 'https://culturaemrede.anapolis.go.gov.br',
} satisfies Source;

export const paulistaMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-paulista',
  name: 'Mapas Culturais — Paulista',
  isActive: true,
  robotsCheckedOn: '2026-11-15',
  termsCheckedOn: '2026-11-15',
  baseUrl: 'https://mapacultural.paulista.pe.gov.br',
} satisfies Source;

export const petrolinaMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-petrolina',
  name: 'Mapas Culturais — Petrolina',
  isActive: true,
  robotsCheckedOn: '2026-11-15',
  termsCheckedOn: '2026-11-15',
  baseUrl: 'https://mapacultural.petrolina.pe.gov.br',
} satisfies Source;

/** Arapiraca's Mapas, not on the GitHub list: 11 calls in 2026, none open on 2026-11-15. */
export const arapiracaMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-arapiraca',
  name: 'Mapas Culturais — Arapiraca',
  isActive: true,
  robotsCheckedOn: '2026-11-15',
  termsCheckedOn: '2026-11-15',
  baseUrl: 'https://mapacultural.arapiraca.al.gov.br',
} satisfies Source;

/**
 * CultBR Editais, the Ministry of Culture's Mapas for municipalities with no instance of their own:
 * 261 calls closing in 2026, 13 open on 2026-11-15. The city is only in the call's text.
 */
export const culturaMunicipalitiesMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-culteditais',
  name: 'Mapas Culturais — CultBR Editais (MinC, municípios)',
  isActive: true,
  robotsCheckedOn: '2026-11-15',
  termsCheckedOn: '2026-11-15',
  baseUrl: 'https://culteditais.cultura.gov.br',
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

/** Minas Gerais' Secult, PNAB calls: the listing links every call's documents (2026-11-15). */
export const minasGeraisSecultPnabSource = {
  kind: 'officialPage',
  slug: 'mg-secult-pnab',
  name: 'Secult MG — editais PNAB',
  isActive: true,
  robotsCheckedOn: '2026-11-15',
  termsCheckedOn: '2026-11-15',
  listingUrl: 'https://www.secult.mg.gov.br/editais/editais-pnab/editais-pnab',
  discovery: { hops: 'documentsOnListing' },
  documentUrlParts: ['/download/category/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/** Minas Gerais' Secult, the state culture fund (FEC): same site and layout as its PNAB page. */
export const minasGeraisSecultFecSource = {
  ...minasGeraisSecultPnabSource,
  slug: 'mg-secult-fec',
  name: 'Secult MG — editais FEC',
  listingUrl: 'https://www.secult.mg.gov.br/editais/fundo-estadual-de-cultura-fec/editais-fec',
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

/**
 * The Ministry of Culture's open calls: one page per call under the listing's path, the only list
 * of the Rouanet program calls (measured 2026-11-15). A call moves to another folder once closed.
 */
export const cultureMinistryOpenCallsSource = {
  kind: 'officialPage',
  slug: 'minc-inscricoes-abertas',
  name: 'Ministério da Cultura — editais com inscrições abertas',
  isActive: true,
  robotsCheckedOn: '2026-11-15',
  termsCheckedOn: '2026-11-15',
  listingUrl: 'https://www.gov.br/cultura/pt-br/assuntos/editais/inscricoes-abertas',
  discovery: { hops: 'callPage', callPageUrlParts: ['/assuntos/editais/inscricoes-abertas/'] },
  documentUrlParts: ['.pdf', '.docx'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Nova Iguaçu's Semcult: its PNAB page links every call's documents, numbered in the link text,
 * many as `http://` (measured 2026-11-15).
 */
export const novaIguacuSemcultSource = {
  kind: 'officialPage',
  slug: 'nova-iguacu-semcult',
  name: 'Semcult Nova Iguaçu — PNAB',
  isActive: true,
  robotsCheckedOn: '2026-11-15',
  termsCheckedOn: '2026-11-15',
  listingUrl: 'https://www.novaiguacu.rj.gov.br/semcult/pnab/',
  discovery: { hops: 'documentsOnListing' },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Salvador's FGM: its "editais abertos" page lists only open calls, each linked as "Clique aqui!",
 * so the call page's own heading names it (measured 2026-11-15).
 */
export const salvadorFgmSource = {
  kind: 'officialPage',
  slug: 'salvador-fgm',
  name: 'Fundação Gregório de Mattos (Salvador) — editais abertos',
  isActive: true,
  robotsCheckedOn: '2026-11-15',
  termsCheckedOn: '2026-11-15',
  listingUrl: 'https://fgm.salvador.ba.gov.br/editais-abertos/',
  discovery: { hops: 'callPage', callPageUrlParts: ['edital-'] },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Bahia'),
} satisfies Source;

/** Jundiaí's culture foundation: one heading per call, its documents under it (2026-11-15). */
export const jundiaiCultureSource = {
  kind: 'officialPage',
  slug: 'jundiai-cultura',
  name: 'Fundação Casa da Cultura e Esportes de Jundiaí — editais e regulamentos',
  isActive: true,
  robotsCheckedOn: '2026-11-15',
  termsCheckedOn: '2026-11-15',
  listingUrl: 'https://cultura.jundiai.sp.gov.br/editais-e-regulamentos/',
  discovery: { hops: 'documentsUnderHeadings' },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Jaboatão dos Guararapes' PNAB Ciclo 2 page: one heading per call (measured 2026-11-15). A page
 * for one cycle: Ciclo 3 will be a new one.
 */
export const jaboataoPnabCycle2Source = {
  kind: 'officialPage',
  slug: 'jaboatao-pnab-ciclo-2',
  name: 'Secretaria de Cultura de Jaboatão dos Guararapes — PNAB Ciclo 2',
  isActive: true,
  robotsCheckedOn: '2026-11-15',
  termsCheckedOn: '2026-11-15',
  listingUrl: 'https://viver.jaboatao.pe.gov.br/pnab/pnab-ciclo-2',
  discovery: { hops: 'documentsUnderHeadings' },
  documentUrlParts: ['/document/', '/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Recife'),
} satisfies Source;

/**
 * Ponta Grossa's culture office: its PNAB page, one heading per call (measured 2026-11-15). Off:
 * it times out from Convex (US East) and answers from Brazil, as Pernambuco.
 */
export const pontaGrossaPnabSource = {
  kind: 'officialPage',
  slug: 'ponta-grossa-pnab',
  name: 'Secretaria Municipal de Cultura de Ponta Grossa — PNAB',
  isActive: false,
  robotsCheckedOn: '2026-11-15',
  termsCheckedOn: '2026-11-15',
  listingUrl: 'https://cultura.pontagrossa.pr.gov.br/lei-aldir-blanc/',
  discovery: { hops: 'documentsUnderHeadings' },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/** What `registerSource` can register, by slug. */
export const registeredSources: readonly Source[] = [
  federalMapasSource,
  canindeMapasSource,
  cearaMapasSource,
  pernambucoMapasSource,
  santoAndreMapasSource,
  aparecidaDeGoianiaMapasSource,
  cimAmfriMapasSource,
  espiritoSantoMapasSource,
  joaoPessoaMapasSource,
  mauaMapasSource,
  natalMapasSource,
  novaLimaMapasSource,
  parauapebasMapasSource,
  paraibaMapasSource,
  sergipeMapasSource,
  anapolisMapasSource,
  paulistaMapasSource,
  petrolinaMapasSource,
  arapiracaMapasSource,
  culturaMunicipalitiesMapasSource,
  bahiaFuncebSource,
  maranhaoSecmaSource,
  minasGeraisSecultPnabSource,
  minasGeraisSecultFecSource,
  paranaSeecSource,
  funarteCallsSource,
  funarteMemoryOfTheArtsSource,
  cultureMinistryOpenCallsSource,
  novaIguacuSemcultSource,
  salvadorFgmSource,
  jundiaiCultureSource,
  jaboataoPnabCycle2Source,
  pontaGrossaPnabSource,
];
