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

/** Times out from Convex (US East) and answers from Brazil: read through Firecrawl from Brazil. */
export const pernambucoMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-pe',
  name: 'Mapas Culturais — Pernambuco',
  isActive: true,
  answersOnlyFromBrazil: true,
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

/** Times out from Convex (US East), as Pernambuco: read through Firecrawl from Brazil. */
export const sergipeMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-se',
  name: 'Mapas Culturais — Sergipe',
  isActive: true,
  answersOnlyFromBrazil: true,
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
 * A vendor-run Mapas for Goiás and Rondônia towns: 43 calls closing in 2026, none open on
 * 2026-11-15. Each call's name starts with its city ("Padre Bernardo-GO - …").
 */
export const agenteCulturalMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-agente-cultural',
  name: 'Mapas Culturais — Agente Cultural (municípios de GO e RO)',
  isActive: true,
  robotsCheckedOn: '2026-11-15',
  termsCheckedOn: '2026-11-15',
  baseUrl: 'https://agentecultural.com.br',
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
 * Ponta Grossa's culture office: its PNAB page, one heading per call (measured 2026-11-15). It
 * times out from Convex (US East) and answers from Brazil, as Pernambuco: read from Brazil.
 */
export const pontaGrossaPnabSource = {
  kind: 'officialPage',
  slug: 'ponta-grossa-pnab',
  name: 'Secretaria Municipal de Cultura de Ponta Grossa — PNAB',
  isActive: true,
  answersOnlyFromBrazil: true,
  robotsCheckedOn: '2026-11-15',
  termsCheckedOn: '2026-11-15',
  listingUrl: 'https://cultura.pontagrossa.pr.gov.br/lei-aldir-blanc/',
  discovery: { hops: 'documentsUnderHeadings' },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Cambé's culture office, PNAB Ciclo II: one page per call (measured 2026-11-15). A page for one
 * cycle: Ciclo III will be a new one.
 */
export const cambePnabCycle2Source = {
  kind: 'officialPage',
  slug: 'cambe-pnab-ciclo-2',
  name: 'Secretaria de Cultura de Cambé — PNAB Ciclo II',
  isActive: true,
  robotsCheckedOn: '2026-11-15',
  termsCheckedOn: '2026-11-15',
  listingUrl:
    'https://www.cambe.pr.gov.br/index.php/secretarias/secretarias/cultura/lei-aldir-blanc/pnab-ciclo-ii/',
  discovery: { hops: 'callPage', callPageUrlParts: ['/pnab-ciclo-ii/edital-0'] },
  documentUrlParts: ['/index.php/download/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/** Delmiro Gouveia's PNAB page: the listing links every call's notice itself (2026-11-15). */
export const delmiroGouveiaPnabSource = {
  kind: 'officialPage',
  slug: 'delmiro-gouveia-pnab',
  name: 'Prefeitura de Delmiro Gouveia — editais PNAB',
  isActive: true,
  robotsCheckedOn: '2026-11-15',
  termsCheckedOn: '2026-11-15',
  listingUrl: 'https://delmirogouveia.al.gov.br/editais-pnab/',
  discovery: { hops: 'documentsOnListing' },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Maceio'),
} satisfies Source;

/**
 * Estância's culture-call site: one page per call, linked as "Acessar"; each file is a download
 * handler (`?id=N`) named only by the bold text above it (measured 2026-11-15).
 */
export const estanciaCultureCallsSource = {
  kind: 'officialPage',
  slug: 'estancia-edital-cultural',
  name: 'Prefeitura de Estância — Edital Cultural',
  isActive: true,
  robotsCheckedOn: '2026-11-15',
  termsCheckedOn: '2026-11-15',
  listingUrl: 'https://editalcultural.estancia.se.gov.br/Editais',
  discovery: { hops: 'callPage', callPageUrlParts: ['/Editais/Details/'] },
  documentUrlParts: ['/Arquivos/DownloadArquivos/'],
  timeZone: ianaTimeZone.parse('America/Maceio'),
} satisfies Source;

/** Cianorte's Mapas: 7 opportunities in 2026, Chamamento 11/2026 open to 18/11 (2026-11-16). */
export const cianorteMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-cianorte',
  name: 'Mapas Culturais — Cianorte',
  isActive: true,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  baseUrl: 'https://cultura.cianorte.pr.gov.br',
} satisfies Source;

/** Itupiranga's Mapas: 4 calls in 2026, all closed by 25/05 (2026-11-16). */
export const itupirangaMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-itupiranga',
  name: 'Mapas Culturais — Itupiranga',
  isActive: true,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  baseUrl: 'https://cultura.itupiranga.pa.gov.br',
} satisfies Source;

/** Itatiba's Mapas: 12 calls in 2026, none open on 2026-11-16. */
export const itatibaMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-itatiba',
  name: 'Mapas Culturais — Itatiba',
  isActive: true,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  baseUrl: 'https://mapacultural.itatiba.sp.gov.br',
} satisfies Source;

/**
 * Pará's state Mapas, which also carries Belém's, Santarém's and Ananindeua's calls: 64 closing in
 * 2026, none really open on 2026-11-16 (one user item "open" to 2111 reads as open-ended).
 */
export const paraMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-pa',
  name: 'Mapas Culturais — Pará',
  isActive: true,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  baseUrl: 'https://mapacultural.pa.gov.br',
} satisfies Source;

/**
 * Goiás' state Mapas (Mapa Goiano): 3 calls in 2026, none open on 2026-11-16, plus an agent's
 * "Agenda aberta" item to 2034 (open-ended).
 */
export const goiasMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-go',
  name: 'Mapas Culturais — Mapa Goiano',
  isActive: true,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  baseUrl: 'https://mapagoiano.cultura.go.gov.br',
} satisfies Source;

/** Tocantins' state Mapas, the Fundo Cultural's only application channel: 3 calls in 2026. */
export const tocantinsMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-to',
  name: 'Mapas Culturais — Tocantins',
  isActive: true,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  baseUrl: 'https://mapa-cultural.to.gov.br',
} satisfies Source;

/**
 * Teixeira de Freitas' culture secretariat, PNAB Ciclo 2: one page per call. The parts leave out
 * the reviewers' credenciamento and the public profile pages (measured 2026-11-16).
 */
export const teixeiraDeFreitasPnabSource = {
  kind: 'officialPage',
  slug: 'teixeira-de-freitas-pnab',
  name: 'Prefeitura de Teixeira de Freitas — editais PNAB',
  isActive: true,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://smic.teixeiradefreitas.ba.gov.br/grupo/pnab/',
  discovery: {
    hops: 'callPage',
    callPageUrlParts: ['/editais/edital-de-chamamento', '/editais/credenciamento-'],
  },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Bahia'),
} satisfies Source;

/**
 * The Chamber of Deputies' cultural selection: one page per yearly call, the notice linked as a
 * clean PDF there (the listing's own anchor ends in `.pdf/view`). Measured 2026-11-16.
 */
export const chamberOfDeputiesCultureSource = {
  kind: 'officialPage',
  slug: 'camara-editais-de-selecao-cultural',
  name: 'Câmara dos Deputados — editais de seleção cultural',
  isActive: true,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl:
    'https://www2.camara.leg.br/a-camara/visiteacamara/cultura-na-camara/editais-de-selecao',
  discovery: {
    hops: 'callPage',
    callPageUrlParts: ['/editais-de-selecao/edital-20', '/editais-de-selecao/copy_of_edital-'],
  },
  documentUrlParts: ['.pdf'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Sapé's PNAB page: one page per call under `/lei-aldir-blanc/`, the notice PDF on it. Measured
 * 2026-11-16: Edital 008/2026 (Fomento Cultural, to 16/11); the older calls post results.
 */
export const sapePnabSource = {
  kind: 'officialPage',
  slug: 'sape-pnab',
  name: 'Prefeitura de Sapé — editais PNAB',
  isActive: true,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://sape.pb.gov.br/politica-nacional-aldir-blanc-pnab/',
  discovery: {
    hops: 'callPage',
    callPageUrlParts: ['/lei-aldir-blanc/edital-', '/lei-aldir-blanc/chamamento-publico-'],
  },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Recife'),
} satisfies Source;

/** Buíque's PNAB 2026 page: one heading per call over its notice. 3 calls, closed (2026-11-16). */
export const buiquePnab2026Source = {
  kind: 'officialPage',
  slug: 'buique-pnab-2026',
  name: 'Prefeitura de Buíque — PNAB 2026',
  isActive: true,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://buique.pe.gov.br/pnab-2026/',
  discovery: { hops: 'documentsUnderHeadings' },
  documentUrlParts: ['/downloads/pnab/'],
  timeZone: ianaTimeZone.parse('America/Recife'),
} satisfies Source;

/**
 * Tijucas' Aldir Blanc page: every notice, rectification and result linked on it, results on the
 * state gazette's host. Chamamentos 001 and 002/2026 post results, so nothing is recorded today.
 */
export const tijucasPnabSource = {
  kind: 'officialPage',
  slug: 'tijucas-pnab',
  name: 'Prefeitura de Tijucas — Lei Aldir Blanc',
  isActive: true,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://www.tijucas.sc.gov.br/especiais/lei-aldir-blanc',
  discovery: { hops: 'documentsOnListing' },
  documentUrlParts: ['/conteudo/paginas/108/', 's3cache.dom.sc.gov.br/atos/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Goiás' Secult, PNAB 2026: one heading per call over its notice and annexes (a new page each
 * year). Measured 2026-11-16: Ocupa Goiás Brasilidades & Futuros and MITsp 2027, both closed.
 */
export const goiasSecultPnab2026Source = {
  kind: 'officialPage',
  slug: 'go-secult-pnab-2026',
  name: 'Secult Goiás — editais PNAB 2026',
  isActive: true,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://goias.gov.br/cultura/pnab/edital-2026-pnab/',
  discovery: { hops: 'documentsUnderHeadings' },
  documentUrlParts: ['/cultura/wp-content/uploads/sites/25/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Alagoas' Secult, 2026 calls: one download category per call (a new listing each year). The
 * parts leave out the incentive-law category. Measured 2026-11-16: Chamamentos 07 and 08/2026.
 */
export const alagoasSecult2026Source = {
  kind: 'officialPage',
  slug: 'al-secult-editais-2026',
  name: 'Secult Alagoas — editais e concursos 2026',
  isActive: true,
  answersOnlyFromBrazil: true,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://secult.al.gov.br/editais-e-concursos/editais-e-concursos-2026',
  discovery: { hops: 'callPage', callPageUrlParts: ['chamamento-publico-n-', '-mostra-'] },
  documentUrlParts: ['task=download.send'],
  timeZone: ianaTimeZone.parse('America/Maceio'),
} satisfies Source;

/**
 * The Federal District's Secec: every notice linked on one page, extensionless files under
 * `/documents/d/secec/`. Measured 2026-11-16: Editais 14 and 15/2026, 21 and 27/2025.
 */
export const federalDistrictSececSource = {
  kind: 'officialPage',
  slug: 'df-secec-editais',
  name: 'Secec DF — editais',
  isActive: true,
  answersOnlyFromBrazil: true,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://www.cultura.df.gov.br/editais-abertos-1',
  discovery: { hops: 'documentsOnListing' },
  documentUrlParts: ['/documents/d/secec/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/** The Federal District PNAB site (with Instituto OMNI): one page per call; Editais 19–21/2026. */
export const federalDistrictPnabSource = {
  kind: 'officialPage',
  slug: 'df-pnab-omni',
  name: 'PNAB DF — editais',
  isActive: true,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://novosite.pnabdf.org.br/',
  discovery: { hops: 'callPage', callPageUrlParts: ['/editais/edital-'] },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Casa das Rosas (Poiesis, a São Paulo state cultural organisation): one page per call. Measured
 * 2026-11-16: Bolsas Ramos de Azevedo and Haroldo de Campos 2026, closed in May.
 */
export const casaDasRosasSource = {
  kind: 'officialPage',
  slug: 'casa-das-rosas-editais',
  name: 'Casa das Rosas — editais',
  isActive: true,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://casadasrosas.org.br/editais/',
  discovery: { hops: 'callPage', callPageUrlParts: ['/edital/'] },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Sesc Sergipe's public calls: the parts keep the artists' calls and leave out races, vendors and
 * the service providers' credenciamento. Measured 2026-11-16: Sescanção 2026.
 */
export const sescSergipeSource = {
  kind: 'officialPage',
  slug: 'sesc-se-chamamentos',
  name: 'Sesc Sergipe — chamamentos públicos',
  isActive: true,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://sesc-se.com.br/chamamento-publico/',
  discovery: {
    hops: 'callPage',
    callPageUrlParts: [
      '/chamamento-publico/convocatoria',
      '/chamamento-publico/aldeia-sesc',
      '/chamamento-publico/sescancao',
      'galeria-de-arte',
    ],
  },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Maceio'),
} satisfies Source;

/**
 * Rio de Janeiro's culture office: one page per call, linked from its home. Measured 2026-11-16:
 * Prêmio Ações Locais and Ações Locais Projetos Continuados, closed in September.
 */
export const rioCultureOfficeSource = {
  kind: 'officialPage',
  slug: 'rio-smc',
  name: 'Secretaria Municipal de Cultura do Rio de Janeiro — editais',
  isActive: true,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://cultura.prefeitura.rio/',
  discovery: {
    hops: 'callPage',
    callPageUrlParts: ['/edital-', '/pesquisa-e-residencia', '/pnab-', '/circuito-'],
  },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Manaus' Concultura, PNAB Ciclo 2: one page per call (Editais 002–013/2026; 001 is a preview link
 * the parts miss). All post results on 2026-11-16, so nothing is recorded until the next cycle.
 */
export const manausConculturaPnabSource = {
  kind: 'officialPage',
  slug: 'manaus-concultura-pnab-ciclo-2',
  name: 'Concultura Manaus — PNAB Ciclo 2',
  isActive: true,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://concultura.manaus.am.gov.br/pnab-ciclo-2',
  discovery: { hops: 'callPage', callPageUrlParts: ['/edital-0'] },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Manaus'),
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
  agenteCulturalMapasSource,
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
  cambePnabCycle2Source,
  delmiroGouveiaPnabSource,
  estanciaCultureCallsSource,
  cianorteMapasSource,
  itupirangaMapasSource,
  itatibaMapasSource,
  paraMapasSource,
  goiasMapasSource,
  tocantinsMapasSource,
  teixeiraDeFreitasPnabSource,
  chamberOfDeputiesCultureSource,
  sapePnabSource,
  buiquePnab2026Source,
  tijucasPnabSource,
  goiasSecultPnab2026Source,
  alagoasSecult2026Source,
  federalDistrictSececSource,
  federalDistrictPnabSource,
  casaDasRosasSource,
  sescSergipeSource,
  rioCultureOfficeSource,
  manausConculturaPnabSource,
];
