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
 * Off: the ba.gov.br terms (rendered by its app from `servicosaocidadao.ba.gov.br`) forbid "a cópia
 * de textos, imagens, ou quaisquer partes"; link and calendar only, until the state agrees.
 */
export const bahiaFuncebSource = {
  kind: 'officialPage',
  slug: 'ba-funceb',
  name: 'Fundação Cultural do Estado da Bahia — editais 2026',
  isActive: false,
  robotsCheckedOn: '2026-11-15',
  termsCheckedOn: '2026-11-19',
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
 * Off: it times out from Convex, and Firecrawl fails on it with every engine, even from Brazil
 * with 90 s (2026-11-17), while it answers a plain request from Brazil in 3 s.
 */
export const alagoasSecult2026Source = {
  kind: 'officialPage',
  slug: 'al-secult-editais-2026',
  name: 'Secult Alagoas — editais e concursos 2026',
  isActive: false,
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

/**
 * Recife's culture secretariat and foundation: one accordion of 196 calls since 2019, each titled
 * by an in-page link and its files under it (2026-11-17: 30 kept after the past-year cuts).
 */
export const recifeCultureSource = {
  kind: 'officialPage',
  slug: 'recife-cultura-editais',
  name: 'Secretaria de Cultura e Fundação de Cultura Cidade do Recife — editais',
  isActive: true,
  robotsCheckedOn: '2026-11-17',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://www.culturarecife.com.br/public/home.php',
  discovery: { hops: 'documentsUnderHeadings', headingClass: 'accordion-toggle' },
  documentUrlParts: ['/documentos/'],
  timeZone: ianaTimeZone.parse('America/Recife'),
} satisfies Source;

/** Spcine's own calls: one accordion button per call, since 2015 (2026-11-17: none kept). */
export const spcineCallsSource = {
  kind: 'officialPage',
  slug: 'spcine-editais',
  name: 'Spcine — editais Spcine',
  isActive: true,
  robotsCheckedOn: '2026-11-17',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://spcine.com.br/editais-spcine/',
  discovery: { hops: 'documentsUnderHeadings', headingClass: 'x-acc-header' },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/** Spcine's PNAB calls, same accordion (2026-11-17: Edital 07/2026, videocast and podcast). */
export const spcinePnabSource = {
  ...spcineCallsSource,
  slug: 'spcine-pnab',
  name: 'Spcine — Política Nacional Aldir Blanc',
  listingUrl: 'https://spcine.com.br/politica-nacional-aldir-blanc/',
} satisfies Source;

/** Spcine's FSA calls, same accordion (2026-11-17: Edital 02/2026, finishing of features). */
export const spcineFsaSource = {
  ...spcineCallsSource,
  slug: 'spcine-fsa',
  name: 'Spcine — editais FSA',
  listingUrl: 'https://spcine.com.br/editais-fsa/',
} satisfies Source;

/**
 * Fundação Cultural Badesc (SC): each call is a post whose text is the notice (applications on a
 * form). The category lists the posts; the yearly exhibitions call is the fixed `/edital` page,
 * linked from the menu. Measured 2026-11-17: Paulo Gaiad 2027, Fernando Beck 2027 (to 24/01/2027).
 */
export const badescCultureSource = {
  kind: 'officialPage',
  slug: 'badesc-chamadas',
  name: 'Fundação Cultural Badesc — chamadas públicas e edital de exposições',
  isActive: true,
  robotsCheckedOn: '2026-11-17',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://fundacaoculturalbadesc.com/chamada-publica-2/',
  discovery: {
    hops: 'callPage',
    callPageUrlParts: ['badesc.com/chamada-publica-2/', 'badesc.com/edital'],
    callPageIsTheNotice: true,
  },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Porto Alegre's culture office lists calls as news posts, newest first, back to 2023; the rules
 * and dates are in the post (Açorianos: applications on Google Forms), notice files rarely on the
 * site itself (others on Drive or the gazette, whose host answers no robots file).
 */
export const portoAlegreCultureSource = {
  kind: 'officialPage',
  slug: 'porto-alegre-smc-editais',
  name: 'Porto Alegre — Secretaria Municipal da Cultura, editais',
  isActive: true,
  robotsCheckedOn: '2026-11-17',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://prefeitura.poa.br/smc/editais',
  discovery: {
    hops: 'callPage',
    callPageUrlParts: ['/smc/noticias/'],
    callPageIsTheNotice: true,
    callPagePublishedAtClass: 'field--name-field-noticia-data-no-calendario',
  },
  documentUrlParts: ['/sites/default/files/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Sesi SP's culture calls: the listing shows only open ones (closed ones move to
 * `/cultura/editais-encerrados`), each a news page whose rules are a PDF on Sesi's media host,
 * named only in the query (`files?file=arq_….pdf`). ~12–15 calls a year, mostly Nov–Feb.
 */
export const sesiSpCultureSource = {
  kind: 'officialPage',
  slug: 'sesi-sp-cultura-editais',
  name: 'Sesi SP — editais de cultura',
  isActive: true,
  robotsCheckedOn: '2026-11-17',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://www.sesisp.org.br/cultura/editais',
  discovery: { hops: 'callPage', callPageUrlParts: ['/cultura/sesi-sp-', '/cultura/edital-de-'] },
  documentUrlParts: ['cronos-media.sesisenaisp.org.br/api/media/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Mapa Cultura Goiás, a privately run Mapas (operator not named, no terms page) carrying 14
 * municipalities' calls: Professor Jamil's Chamamento 06/2026 open to 19/11 on 2026-11-16.
 */
export const goiasMunicipalitiesMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-cultura-goias',
  name: 'Mapas Culturais — Mapa Cultura Goiás (municípios)',
  isActive: true,
  robotsCheckedOn: '2026-11-17',
  termsCheckedOn: '2026-11-17',
  baseUrl: 'https://mapa.culturagoias.com.br',
} satisfies Source;

/**
 * Paulo Afonso's Seculte: the listing titles each call with an `<h3>` and links its files under
 * it, served by a WordPress plugin at the site root (`?smti_edital_download=1&…`), named only in
 * the link text.
 */
export const pauloAfonsoSeculteSource = {
  kind: 'officialPage',
  slug: 'paulo-afonso-seculte-editais',
  name: 'Paulo Afonso — Seculte, editais',
  isActive: true,
  robotsCheckedOn: '2026-11-17',
  termsCheckedOn: '2026-11-17',
  listingUrl: 'https://cultura.pauloafonso.ba.gov.br/editais/',
  discovery: { hops: 'documentsUnderHeadings' },
  documentUrlParts: ['smti_edital_download=1'],
  timeZone: ianaTimeZone.parse('America/Bahia'),
} satisfies Source;

/**
 * Funesc, Paraíba's state culture foundation: one Plone page per call under `/editais/`, its files
 * linked through their `/view` pages. ~20 calls in 2026 among ~80 back to 2024. Off: it times out
 * from Convex (2026-11-17), and through Firecrawl its ~67 call pages cost ~68 credits a day. Its
 * Plone REST API lists every file in one request, but only with `Accept: application/json`, which
 * Firecrawl does not forward (measured: 404).
 */
export const paraibaFunescSource = {
  kind: 'officialPage',
  slug: 'pb-funesc-editais',
  name: 'Funesc-PB — editais',
  isActive: false,
  robotsCheckedOn: '2026-11-17',
  termsCheckedOn: '2026-11-17',
  listingUrl: 'https://funesc.pb.gov.br/editais',
  discovery: { hops: 'callPage', callPageUrlParts: ['funesc.pb.gov.br/editais/'] },
  documentUrlParts: ['.pdf'],
  timeZone: ianaTimeZone.parse('America/Fortaleza'),
} satisfies Source;

/**
 * Magé's Seculte (RJ): one page for every municipal notice (culture, housing, nurseries, street
 * vendors), each call a block opened by its image, its files labelled only "Edital", "Errata",
 * "Resultado" (the number is in the file name, and not always: 009 is `EDITAL-ESCOLA-DO-SAMBA-4`).
 * Off: `documentsOnListing` reads no call from it (measured 2026-11-18); it needs a call number
 * from the file name and the image as the call's boundary. Its 2026 culture calls (007–014, PNAB
 * Ciclo 2) all post final results.
 */
export const mageSeculteSource = {
  kind: 'officialPage',
  slug: 'mage-seculte-editais',
  name: 'Magé — Seculte, editais',
  isActive: false,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://mage.rj.gov.br/editais/',
  discovery: { hops: 'documentsOnListing' },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Balneário Camboriú's Fundação Cultural (SC): ~11 numbered calls a year. 7 of 2026's are posts
 * with the notice linked; 4 (003, 008, 010, 011, PNAB among them) are hub pages linking only result
 * posts, a hop the reader does not take. Off (measured 2026-11-18): the listing also links the
 * council's minutes and other frame pages, and 5 of the 7 posts print no close, so closed calls
 * would be read.
 */
export const balnearioCamboriuFcbcSource = {
  kind: 'officialPage',
  slug: 'balneario-camboriu-fcbc-editais',
  name: 'Balneário Camboriú — Fundação Cultural, editais',
  isActive: false,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://culturabc.com.br/editais-fundacao-cultural/',
  discovery: {
    hops: 'callPage',
    callPageUrlParts: ['culturabc.com.br/20', 'culturabc.com.br/editais-fundacao-cultural/edital-'],
  },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Itajaí's Fundação Cultural (SC), "Abertos 2026": ~16 calls in 2026, Elementor puts each
 * document link under its own heading and labels say "EDITAL 015 – …" with no year. Off (measured
 * 2026-11-18): `documentsOnListing` groups wrongly (016 takes 21 documents of other calls) and
 * `documentsUnderHeadings` finds none; it needs a call number without a year and a heading per
 * document.
 */
export const itajaiFciSource = {
  kind: 'officialPage',
  slug: 'itajai-fci-abertos',
  name: 'Itajaí — Fundação Cultural, editais abertos',
  isActive: false,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://fundacaocultural.itajai.sc.gov.br/abertos-2026/',
  discovery: { hops: 'documentsOnListing' },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Lagoa Santa's Mapas: 7 calls in 2026, none open on 2026-11-17 (PNAB Ciclo 3 in public
 * consultation to 14/12). Its robots allows all, with Cloudflare's `ai-train=no` content signal.
 */
export const lagoaSantaMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-lagoa-santa',
  name: 'Mapas Culturais — Lagoa Santa',
  isActive: true,
  robotsCheckedOn: '2026-11-17',
  termsCheckedOn: '2026-11-17',
  baseUrl: 'https://mapacultural.lagoasanta.mg.gov.br',
} satisfies Source;

/**
 * São Bernardo do Campo's Mapas: 42 calls in 2026. It times out from Convex and sends an
 * incomplete TLS chain; Firecrawl from Brazil reads it (2026-11-17), as Pernambuco.
 */
export const saoBernardoMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-sao-bernardo',
  name: 'Mapas Culturais — São Bernardo do Campo',
  isActive: true,
  answersOnlyFromBrazil: true,
  robotsCheckedOn: '2026-11-17',
  termsCheckedOn: '2026-11-17',
  baseUrl: 'https://mapacultural.saobernardo.sp.gov.br',
} satisfies Source;

/**
 * Londrina's Mapas ("Londrina Cultura"; PROMIC, FSA local, PNAB Ciclo 2): 27 calls closing in 2026,
 * 2 open on 2026-11-18. Its server sends no GoGetSSL RSA DV CA intermediate, so Convex cannot
 * verify it; Firecrawl from Brazil reads it, as São Bernardo. The city's PROMIC page lists the same
 * calls behind "clique aqui" links. `robots.txt` names only Amazonbot and AhrefsBot; no terms.
 */
export const londrinaMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-londrina',
  name: 'Mapas Culturais — Londrina',
  isActive: true,
  answersOnlyFromBrazil: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  baseUrl: 'https://londrinacultura.londrina.pr.gov.br',
} satisfies Source;

/**
 * The PNAB platform several states run (one build; vendor not named): its listing of open calls
 * only, each a page at a root slug ("Acessar") titled by its `<h1>`, files at `/lerarquivo/…`.
 * Measured 2026-11-17: 0 open on all six (~44 calls in 2026), the next wave is PNAB Ciclo 3.
 * Menu pages are fetched too; the two with files (Amapá's "Material de apoio", Bahia's
 * "Transparência") are recorded with no notice, never read.
 */
const pnabPlatformSource = ({
  slug,
  name,
  host,
  timeZone,
}: {
  slug: string;
  name: string;
  host: string;
  timeZone: string;
}) =>
  ({
    kind: 'officialPage',
    slug,
    name,
    isActive: true,
    robotsCheckedOn: '2026-11-17',
    termsCheckedOn: '2026-11-17',
    listingUrl: `https://${host}/editais?situacao=abertos`,
    discovery: { hops: 'callPage', callPageUrlParts: [`${host}/`] },
    documentUrlParts: ['/lerarquivo/'],
    timeZone: ianaTimeZone.parse(timeZone),
  }) satisfies Source;

export const bahiaPnabPlatformSource = pnabPlatformSource({
  slug: 'pnab-bahia',
  name: 'PNAB Bahia — editais (Secult-BA)',
  host: 'bahiapnab.com.br',
  timeZone: 'America/Bahia',
});
export const piauiPnabPlatformSource = pnabPlatformSource({
  slug: 'pnab-piaui',
  name: 'PNAB Piauí — editais',
  host: 'pnabpiaui.com.br',
  timeZone: 'America/Fortaleza',
});
export const amazonasPnabPlatformSource = pnabPlatformSource({
  slug: 'pnab-amazonas',
  name: 'PNAB Amazonas — editais',
  host: 'pnab.cultura.am.gov.br',
  timeZone: 'America/Manaus',
});
export const amapaPnabPlatformSource = pnabPlatformSource({
  slug: 'pnab-amapa',
  name: 'PNAB Amapá — editais',
  host: 'pnabamapa.com.br',
  timeZone: 'America/Belem',
});
export const tocantinsPnabPlatformSource = pnabPlatformSource({
  slug: 'pnab-tocantins',
  name: 'PNAB Tocantins — editais',
  host: 'pnabtocantins.com.br',
  timeZone: 'America/Araguaina',
});
export const macapaPnabPlatformSource = pnabPlatformSource({
  slug: 'pnab-macapa',
  name: 'PNAB Macapá — editais (Fumcult)',
  host: 'pnabmacapa.com.br',
  timeZone: 'America/Belem',
});

/**
 * Maringá's Mapas: 21 calls in 2026; 4 open on 2026-11-17 (Ocupação dos Espaços Culturais 2027,
 * Bolsas Cultura Viva, CEU das Artes, Pontão de Cultura). It times out from Convex: read through
 * Firecrawl from Brazil, as Pernambuco.
 */
export const maringaMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-maringa',
  name: 'Mapas Culturais — Maringá',
  isActive: true,
  answersOnlyFromBrazil: true,
  robotsCheckedOn: '2026-11-17',
  termsCheckedOn: '2026-11-17',
  baseUrl: 'https://maringacultura.maringa.pr.gov.br',
} satisfies Source;

/**
 * Santa Luzia's Mapas (MG): 48 items closing in 2026, none open on 2026-11-18. About half are no
 * call (council meetings, elections, appeal steps): `reasonToSkipReadingDocuments` skips them.
 */
export const santaLuziaMapasSource = {
  kind: 'mapasCulturaisInstance',
  slug: 'mapas-santa-luzia',
  name: 'Mapas Culturais — Santa Luzia',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  baseUrl: 'https://mapacultural.santaluzia.mg.gov.br',
} satisfies Source;

/**
 * Rio Branco's culture portal (Fundação Garibaldi Brasil, Fundo Municipal, PNAB): the listing page
 * is an Alpine template filled from a JSON list of the calls (40, back to 2020); each call's page
 * is server-rendered with its labelled files (extensionless downloads) and prints "Data de Término
 * das Inscrições". 9 calls in 2026, none open on 2026-11-18.
 */
export const rioBrancoCulturaSource = {
  kind: 'officialPage',
  slug: 'rio-branco-cultura-editais',
  name: 'Rio Branco — Fundação Garibaldi Brasil, editais',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://cultura.riobranco.ac.gov.br/admin/editais/edital-listar-json',
  discovery: {
    hops: 'callPage',
    callPageUrlParts: ['/site/edital-documento/'],
    callPagesListedAsJson: { callPagePath: '/site/edital-documento/{id}', titleField: 'titulo' },
  },
  documentUrlParts: ['/site/edital-documento/download/'],
  timeZone: ianaTimeZone.parse('America/Rio_Branco'),
} satisfies Source;

/**
 * Caruaru's culture portal (PE; a Laravel + Inertia app, not Mapas): `/oportunidades` carries its
 * items as JSON in the page's `data-page`, one item per file (22: notices and each annex apart),
 * with nothing tying a file to its call. Off (measured 2026-11-18): no reader groups loose files
 * into calls, and none was open (Rock Azulado 2026 closed in April).
 */
export const caruaruOportunidadesSource = {
  kind: 'officialPage',
  slug: 'caruaru-oportunidades',
  name: 'Caruaru — oportunidades',
  isActive: false,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://mapacultural.caruaru.pe.gov.br/oportunidades',
  discovery: { hops: 'documentsOnListing' },
  documentUrlParts: ['editais_oportunidades/'],
  timeZone: ianaTimeZone.parse('America/Recife'),
} satisfies Source;

/**
 * Porto Velho's culture foundation (Funcultural, RO): a Livewire file manager whose folders open
 * by button, each also served at `?folder=N`. "Editais" holds one folder per year (2019–2026),
 * each one folder per call, whose files sit in it or in one folder per document. 4 calls in 2026,
 * none open on 2026-11-18 (004/2026 closed 04/11). `robots.txt` disallows nothing; no terms found.
 */
export const portoVelhoFunculturalSource = {
  kind: 'officialPage',
  slug: 'porto-velho-funcultural-editais',
  name: 'Porto Velho — Funcultural, editais',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://funcultural.portovelho.ro.gov.br/arquivos?folder=33997',
  discovery: {
    hops: 'callPage',
    callPageUrlParts: ['?folder='],
    callsFiledInYearFolders: true,
    callPageNeedsNotice: true,
  },
  documentUrlParts: ['/uploads/arquivos/'],
  timeZone: ianaTimeZone.parse('America/Porto_Velho'),
} satisfies Source;

/**
 * Palmas' culture foundation (FCP, TO) on the city's portal: one folder per call or subject
 * (`?arquivo_pasta=<uuid>`, real links), each file linked by an eye icon named only by its
 * `aria-label` ("Visualizar PDF Edital … Nº 05/2026/FCP"). Courses, the city's plan and its history
 * sit in folders too, with no notice. The 10th Salão (05/2026) closed 24/09/2026. `robots.txt`
 * answers 404; `/core/lgpd/` has no clause on automated access.
 */
export const palmasFcpSource = {
  kind: 'officialPage',
  slug: 'palmas-fcp-arquivos',
  name: 'Palmas — Fundação Cultural, arquivos',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://www.palmas.to.gov.br/core/orgao/fundacao-cultural/',
  discovery: { hops: 'callPage', callPageUrlParts: ['arquivo_pasta='], callPageNeedsNotice: true },
  documentUrlParts: ['/media/arquivo/'],
  timeZone: ianaTimeZone.parse('America/Araguaina'),
} satisfies Source;

/**
 * Minas Gerais' Fundação Clóvis Salgado (Palácio das Artes): one WordPress page with a heading per
 * call ("6º Prêmio Décio Noviello…"), each file linked as "Acesse aqui o Edital", years back to
 * 2017, and its management contract's documents below. 1 call in 2026 and 3 programming calls
 * (Chamamento 01–03/2025) with no result posted on 2026-11-18. `robots.txt` disallows only
 * `/wp-admin/`; its LGPD page has no clause on automated access.
 */
export const clovisSalgadoFoundationSource = {
  kind: 'officialPage',
  slug: 'fundacao-clovis-salgado-editais',
  name: 'Fundação Clóvis Salgado — editais',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://fcs.mg.gov.br/editais/',
  discovery: { hops: 'documentsUnderHeadings' },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Mato Grosso do Sul's culture foundation (FCMS), "Consultas": a table, one row per call, the name
 * in "Assunto" and the file linked as "Acessar proposta". Off (measured 2026-11-18): the menu's
 * `<script>` is never closed, so the table is script text to the reader (and to a browser); and
 * a row-per-call listing has no reader. 8 rows, 2 "Em andamento" (Prêmio Guadakan, 26/2026).
 */
export const matoGrossoDoSulFcmsSource = {
  kind: 'officialPage',
  slug: 'fcms-consultas',
  name: 'FCMS — consultas de editais',
  isActive: false,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://www.fundacaodecultura.ms.gov.br/informativos/consultas/',
  discovery: { hops: 'documentsOnListing' },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Campo_Grande'),
} satisfies Source;

/**
 * Erechim's PNAB page (RS): one page per year ("2026"), each linking its calls' pages ("PNAB -
 * Edital nº 04/2026 - Fomento Cultural Geral"), whose files sit in `/uploads/paginas/`. Links are
 * relative to a `<base href>` with a double slash. Its 3 calls of 2026 closed 09/04/2026 with
 * results posted (measured 2026-11-18). `robots.txt` disallows only `/admin`; no terms page.
 */
export const erechimPnabSource = {
  kind: 'officialPage',
  slug: 'erechim-pnab',
  name: 'Erechim — Política Nacional Aldir Blanc',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://www.pmerechim.rs.gov.br/pagina/1727/politica-nacional-aldir-blanc',
  discovery: { hops: 'callPage', callPageUrlParts: ['-edital-'], callPagesOnYearPages: true },
  documentUrlParts: ['/uploads/paginas/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Araxá's Fundação Calmon Barreto (MG), PNAB Ciclo 2: one page per item, calls ("EDITAL DE
 * CHAMAMENTO PÚBLICO Nº 01/2026 …") mixed with notices to all calls (schedule, applicants list,
 * results), files in `/dados/fomento/`. Off (measured 2026-11-18): results are items of their own,
 * never on the call's page, which prints no close, so its 3 closed calls would cost 139 pages; the
 * schedule's file reads as a notice; each cycle is a new category of `/fomento`.
 */
export const araxaCalmonBarretoSource = {
  kind: 'officialPage',
  slug: 'araxa-calmon-barreto-pnab-ciclo-2',
  name: 'Araxá — Fundação Calmon Barreto, PNAB Ciclo 2',
  isActive: false,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://fundacaocalmonbarreto.mg.gov.br/fomento/categoria/6/lei-aldir-blanc-ciclo-2',
  discovery: { hops: 'callPage', callPageUrlParts: ['/lei-aldir-blanc-ciclo-2/link/'] },
  documentUrlParts: ['/dados/fomento/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * IPHAN's open calls on gov.br (Volto): the listing's items and each call's file links live only in
 * the page's embedded state (`linksOfHtml` reads it), files served at `…/@@display-file/file`.
 * Items mix calls with consultant hires (`Projeto 914BRZ…`) and market surveys, recorded and never
 * read (`notACallTitlePattern`), and opinions, agreements and statements, with no notice. Its
 * creator prizes (Mário de Andrade, Sílvio Romero) come each July: 2026's closed 04/08.
 */
export const iphanOpenCallsSource = {
  kind: 'officialPage',
  slug: 'iphan-editais-abertos',
  name: 'IPHAN — editais e seleções abertos',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://www.gov.br/iphan/pt-br/acesso-a-informacao/editais-e-selecoes/abertos',
  discovery: {
    hops: 'callPage',
    callPageUrlParts: ['/iphan/pt-br/acesso-a-informacao/editais-e-selecoes/abertos/'],
  },
  documentUrlParts: ['/@@display-file/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Museu do Índio (FUNAI) on gov.br (Volto): three pages — consultant hires (to 2023), use of its
 * spaces, and the credenciamento of Indigenous cultural associations (Edital 90008/2025, open to
 * new entrants for 5 years, its first list posted). Links only in the page state, as IPHAN's.
 */
export const museuDoIndioCallsSource = {
  kind: 'officialPage',
  slug: 'museu-do-indio-editais',
  name: 'Museu do Índio — editais',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://www.gov.br/museudoindio/pt-br/acesso-a-informacao/editais',
  discovery: {
    hops: 'callPage',
    callPageUrlParts: ['/museudoindio/pt-br/acesso-a-informacao/editais/'],
  },
  documentUrlParts: ['/@@display-file/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * UFU's culture and extension calls (Uberlândia, MG; Drupal): one node per call, files in
 * `/sites/editais.ufu.br/files/`. Most nodes are for its students (grants, courses); only
 * "Processo Seletivo de Profissionais" is open to anyone: artists and technicians paid per project.
 * `robots.txt` asks `Crawl-delay: 10`; no terms page, footer "Todos os direitos reservados".
 */
export const ufuProexcCultureSource = {
  kind: 'officialPage',
  slug: 'ufu-proexc-extensao-cultura',
  name: 'UFU — PROEXC, editais de extensão e cultura',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://editais.ufu.br/extensao-cultura',
  discovery: { hops: 'callPage', callPageUrlParts: ['/node/'], crawlDelaySeconds: 10 },
  callTitleParts: ['processo seletivo de profissionais'],
  documentUrlParts: ['/sites/editais.ufu.br/files/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Sesc Roraima's credenciamentos: one page, every file a link titled "EDITAL Nº 06/2026 –
 * CREDENCIAMENTO ARTÍSTICO – …" under a year heading, beside its food vendors' (Edital 11/2026,
 * Semana S), left out by title. The artists' call opens each January to February (06/2026 closed
 * 28/02, results posted). `robots.txt` WordPress defaults; terms cited, `/termos-de-uso/` 404.
 */
export const sescRoraimaArtistCredentialingSource = {
  kind: 'officialPage',
  slug: 'sesc-rr-credenciamento-artistico',
  name: 'Sesc Roraima — credenciamento artístico',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://www.sescrr.com.br/cultura/edital-de-credenciamento-de-artistas/',
  discovery: { hops: 'documentsOnListing' },
  callTitleParts: ['credenciamento artistico'],
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Boa_Vista'),
} satisfies Source;

/**
 * Sesc Roraima's visual arts calls: files titled "EDITAL Nº 01/2026 – CULTURA – INTERVENÇÕES DE
 * MURALISMO" under a year heading (MEI only, closed with its final result in February 2026).
 */
export const sescRoraimaVisualArtsSource = {
  kind: 'officialPage',
  slug: 'sesc-rr-artes-visuais',
  name: 'Sesc Roraima — editais de artes visuais',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://www.sescrr.com.br/editais-de-artes-visuais/',
  discovery: { hops: 'documentsOnListing' },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Boa_Vista'),
} satisfies Source;

/**
 * Fundação José Augusto (RN state culture): a Nextcloud file browser, one folder per call under
 * "Editais Abertos", its files one level down ("PUBLICAÇÕES CHAMADA 01_26", "ANEXOS…"), served at
 * `/wp-json/nextcloud/v1/download?filePath=…`. Its two 2026 calls opened in January–February and
 * post Etapa II results; the rest are 2023–2024. WordPress `robots.txt`; privacy policy only. Off:
 * it times out from Convex (2026-11-18); through Firecrawl ~8 pages a day, so on in its season
 * (January), measured through Firecrawl first.
 */
export const rioGrandeDoNorteFjaSource = {
  kind: 'officialPage',
  slug: 'rn-fja-editais-abertos',
  name: 'Fundação José Augusto (RN) — editais abertos',
  isActive: false,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://www.cultura.rn.gov.br/documentos/Editais%20Culturais/Editais%20Abertos/',
  discovery: {
    hops: 'callPage',
    callPageUrlParts: ['/Editais%20Abertos/'],
    callFilesInSubfolders: true,
  },
  documentUrlParts: ['/wp-json/nextcloud/v1/download'],
  timeZone: ianaTimeZone.parse('America/Fortaleza'),
} satisfies Source;

/**
 * Secult-ES's calls page: one heading per call, its files under it (`/media/…?v=<upload time>`), 27
 * calls back to 2019. Its PNAB calls apply through the ES Mapas (registered). Three 2020 calls name
 * no year and post no result, so they are read once (~20 pages; team choice over a new rule).
 * `robots.txt` and terms 404; an LGPD page only.
 */
export const espiritoSantoSecultCallsSource = {
  kind: 'officialPage',
  slug: 'es-secult-editais-de-chamamento',
  name: 'Secult-ES — editais de chamamento',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://secult.es.gov.br/editaisdechamamento',
  discovery: { hops: 'documentsUnderHeadings' },
  documentUrlParts: ['/media/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Secult-ES's yearly calls with a page of their own (Circulação e Intercâmbio, monthly rounds,
 * 2026: 17/03 to 06/11; Parque das Esculturas), reached from the calls page's menu: their URL
 * changes each year (`…-intercambio-2026-2`), the menu link does not.
 */
export const espiritoSantoSecultCallPagesSource = {
  kind: 'officialPage',
  slug: 'es-secult-grupos-de-arquivos',
  name: 'Secult-ES — editais com página própria',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://secult.es.gov.br/editaisdechamamento',
  discovery: { hops: 'callPage', callPageUrlParts: ['/GrupodeArquivos/edital-'] },
  documentUrlParts: ['/media/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Balsas' culture office (MA): one page per call (`cultura_editais.php?id=N`), linked as "Mais
 * informações", its `<h1>` the call ("EDITAL DE CHAMAMENTO PÚBLICO Nº 02/2026 - ENCERRADO"); its
 * window ("11/09/2026 - 02/10/2026") is no close the reader parses, so a call drops by its result.
 * The listing also names the artists of the city's register: only call pages are followed.
 * `robots.txt` keeps `/anexo/`, `/arquivos/` from all and bars some engines by name; no terms.
 */
export const balsasCultureSource = {
  kind: 'officialPage',
  slug: 'balsas-cultura-editais',
  name: 'Balsas — Secretaria de Cultura, editais',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://www.balsas.ma.gov.br/cultura.php',
  discovery: { hops: 'callPage', callPageUrlParts: ['cultura_editais.php?id='] },
  documentUrlParts: ['/cultura/editais/'],
  timeZone: ianaTimeZone.parse('America/Fortaleza'),
} satisfies Source;

/**
 * Coronel Fabriciano's culture platform (MG): each call at `/edital/<uuid>`, linked as "Ver
 * edital", its `<h1>` the call's name, its page printing "Período de inscrição … até …"; files
 * on the platform's DigitalOcean Spaces bucket. `robots.txt` allows everything; no terms page.
 */
export const coronelFabricianoCultureSource = {
  kind: 'officialPage',
  slug: 'coronel-fabriciano-cultura-editais',
  name: 'Coronel Fabriciano — plataforma de editais da cultura',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://cultura.fabriciano.mg.gov.br/editais',
  discovery: { hops: 'callPage', callPageUrlParts: ['/edital/'] },
  documentUrlParts: ['siscultura.sfo3.digitaloceanspaces.com/media/org-2/editais/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Itaperuna's culture sign-up system (RJ): one page per call (`edital.php?e=…`), linked as "Ver
 * edital e inscrever-se"; its `<h1>` names the form, the line below it the call ("Edital de
 * Chamamento Público nº 01/2026 — …"). Every file is `edital_arquivo.php?id=N`, so only its link
 * text tells the notice from an annex. `robots.txt` 404 (the city portal's, 500, is not used).
 */
export const itaperunaCultureSource = {
  kind: 'officialPage',
  slug: 'itaperuna-cultura-inscricoes',
  name: 'Itaperuna — sistema de inscrições da cultura',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://prefeituraitaperuna.com.br/sistema-inscricoes/public/',
  discovery: {
    hops: 'callPage',
    callPageUrlParts: ['edital.php?e='],
    callPageTitleClass: 'texto-secundario',
  },
  documentUrlParts: ['edital_arquivo.php?id='],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Araguaína's culture office (TO): calls at root slugs sharing no URL part, so any page on the
 * host is a candidate and the title filter keeps the "Acessar Edital" links (the menu's "Editais"
 * fails it); named by `elementor-heading-title` (no `<h1>`). Off: two call pages link the same old
 * notice above their own, read as both calls' notice; turns on with a rule for a notice several
 * call pages link, and "Acessar Edital" in `namesNoCall`. robots: `/wp-admin/` only; no terms.
 */
export const araguainaCultureSource = {
  kind: 'officialPage',
  slug: 'araguaina-cultura-editais',
  name: 'Araguaína — SEMECL, editais',
  isActive: false,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://cultura.araguaina.to.gov.br/editais-2/',
  discovery: {
    hops: 'callPage',
    callPageUrlParts: ['cultura.araguaina.to.gov.br/'],
    callPageTitleClass: 'elementor-heading-title',
  },
  callTitleParts: ['edital'],
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Araguaina'),
} satisfies Source;

/**
 * São Paulo city's culture office (SMC): ~35 topic pages (Fomento ao Circo, VAI, PROMAC…), each
 * keeping every edition as a dated block. Off: no reader mode reads dated blocks, and topic pages
 * lag (Circo's ends at 2025; its 2026 edition is only in the 08/05/2026 news of 12 calls). Half
 * the links are on `capital.sp.gov.br`, which 302s to this host (robots too). Terms: a city
 * "Conteúdo livre" page, no licence printed on these pages; whether that allows us is still open.
 */
export const saoPauloCultureSource = {
  kind: 'officialPage',
  slug: 'sao-paulo-smc-editais',
  name: 'São Paulo — Secretaria Municipal de Cultura, editais',
  isActive: false,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://prefeitura.sp.gov.br/web/cultura/editais/',
  discovery: { hops: 'callPage', callPageUrlParts: ['/web/cultura/w/'] },
  documentUrlParts: ['/documents/d/cultura/', '/cidade/upload/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Sesi MG's culture news (Fiemg): calls are news posts (SESI em Cena, the galleries, Ciclo ODS), so
 * only titles naming a call are opened, and only posts linking a notice are calls ("Resultado do
 * chamamento…" links none). Posts usually print their window, so closed ones go unread.
 * `robots.txt`: `Crawl-delay: 10`, nothing disallowed; only a privacy notice, no terms.
 */
export const sesiMinasCultureNewsSource = {
  kind: 'officialPage',
  slug: 'sesi-mg-cultura-noticias',
  name: 'Sesi MG — Sesi Cultura, notícias',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://www.fiemg.com.br/sesi-cultura/noticias/',
  discovery: {
    hops: 'callPage',
    callPageUrlParts: ['/sesi-cultura/noticias/'],
    crawlDelaySeconds: 10,
    callPageNeedsNotice: true,
  },
  callTitleParts: ['edital', 'chamamento', 'selecao', 'convocatoria'],
  documentUrlParts: ['/sesi-cultura/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Secult-RN's Mais Cultura platform (vendor Seletar): one listing per group of calls, each a card
 * linking `/editais/editais/N/` with its title, description and status as one text, so the title
 * comes from the call page and a card saying "Inscrições encerradas" is not opened. Files on
 * DigitalOcean Spaces. `robots.txt` 404; no terms. Groups 1 and 2 hold only 2023 calls; this is
 * group 3, the PNAB calls (Blocos I–V, 2024–2026).
 */
export const rioGrandeDoNortePnabSource = {
  kind: 'officialPage',
  slug: 'rn-mais-cultura-pnab',
  name: 'Secult-RN — Mais Cultura, editais PNAB',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://maiscultura.rn.gov.br/editais/?grupo=3',
  discovery: {
    hops: 'callPage',
    callPageUrlParts: ['/editais/editais/'],
    callTitleOnCallPage: true,
  },
  documentUrlParts: ['/seletar/media/editais/'],
  timeZone: ianaTimeZone.parse('America/Fortaleza'),
} satisfies Source;

/** Mais Cultura RN group 4, same platform: regional audiovisual calls (20/2026, open to 07/12). */
export const rioGrandeDoNorteAudiovisualSource = {
  ...rioGrandeDoNortePnabSource,
  slug: 'rn-mais-cultura-arranjos-regionais',
  name: 'Secult-RN — Mais Cultura, Arranjos Regionais do audiovisual',
  listingUrl: 'https://maiscultura.rn.gov.br/editais/?grupo=4',
} satisfies Source;

/**
 * Fundação Cultural do Pará: one page per call (`/edital/N`), each a card whose text starts with
 * "Abertura: … Modalidade: …", so the title comes from the call page's `<h1>`. It also lists staff
 * hires (Processo Seletivo Simplificado), recorded but never read. `robots.txt` 404; no terms.
 */
export const paraFcpSource = {
  kind: 'officialPage',
  slug: 'pa-fcp-editais',
  name: 'Fundação Cultural do Pará — editais',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://fcp.pa.gov.br/editais',
  discovery: { hops: 'callPage', callPageUrlParts: ['/edital/'], callTitleOnCallPage: true },
  documentUrlParts: ['/midias/anexos/'],
  timeZone: ianaTimeZone.parse('America/Belem'),
} satisfies Source;

/**
 * Escada-PE (2026-11-16): its notices are named "Edital 001 de 2026", which `callNumberOf` does not
 * read (it reads "nº/ano"). Off until it does.
 */
export const escadaPnabSource = {
  kind: 'officialPage',
  slug: 'escada-pnab',
  name: 'Escada — editais Aldir Blanc 2026',
  isActive: false,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://escada.pe.gov.br/editais-aldir-blanc-2026/',
  discovery: { hops: 'documentsOnListing' },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Recife'),
} satisfies Source;

/**
 * Curvelo-MG (2026-11-16): its headings are cycles ("Ciclo 2", "Ciclo 1"), each over several calls,
 * so a heading is no call. Off until calls are told apart inside a heading.
 */
export const curveloPnabSource = {
  kind: 'officialPage',
  slug: 'curvelo-pnab',
  name: 'Curvelo — Política Nacional Aldir Blanc',
  isActive: false,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://curvelo.mg.gov.br/politica-nacional-aldir-blanc-pnab',
  discovery: { hops: 'documentsUnderHeadings' },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Santa Luzia-MA (2026-11-16): its links (`/upload/lei_audir_blanc/<n>.pdf`) carry no call number,
 * so no listed file names its call. Off until a call is named some other way.
 */
export const santaLuziaMaranhaoPnabSource = {
  kind: 'officialPage',
  slug: 'santa-luzia-ma-pnab',
  name: 'Santa Luzia (MA) — Política Nacional Aldir Blanc',
  isActive: false,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://santaluzia.ma.gov.br/politica-nacional-aldir-blanc',
  discovery: { hops: 'documentsOnListing' },
  documentUrlParts: ['/upload/lei_audir_blanc/'],
  timeZone: ianaTimeZone.parse('America/Fortaleza'),
} satisfies Source;

/**
 * Tramandaí-RS: did not answer on 2026-11-16; on 2026-11-18 it serves dated items with files at
 * `/conteudos_documentos/<hash>.pdf`, not yet measured with the reader. Off until measured.
 */
export const tramandaiPnabSource = {
  kind: 'officialPage',
  slug: 'tramandai-pnab',
  name: 'Tramandaí — PNAB',
  isActive: false,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://tramandai.rs.gov.br/conteudo/500042-pnab-politica-nacional-aldir-blanc',
  discovery: { hops: 'documentsOnListing' },
  documentUrlParts: ['/conteudos_documentos/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Sapiranga-RS (2026-11-18): every city call on one listing (trade fairs, school hires; culture
 * only "Edital 112/2026 – Pontos e Pontões"), and its call page links no `.pdf`: where its files
 * sit is unmeasured. Off until a culture filter and its files are measured.
 */
export const sapirangaCallsSource = {
  kind: 'officialPage',
  slug: 'sapiranga-editais',
  name: 'Sapiranga — editais',
  isActive: false,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://www.sapiranga.rs.gov.br/editais/',
  discovery: { hops: 'callPage', callPageUrlParts: ['/edital/'] },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Santo Antônio do Descoberto-GO (2026-11-18): the category page prints no links in its HTML
 * (a script fills it), so no call page is found. Off until its listing is read some other way.
 */
export const santoAntonioDoDescobertoSource = {
  kind: 'officialPage',
  slug: 'santo-antonio-do-descoberto-cultura',
  name: 'Santo Antônio do Descoberto — notícias da cultura',
  isActive: false,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://santoantoniododescoberto.go.gov.br/noticias/?category=40',
  discovery: { hops: 'callPage', callPageUrlParts: ['/chamamento-publico-'] },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Quirinópolis-GO (2026-11-16): one "EDITAIS" heading over every call's ~100 files, so the
 * heading names no call. Off until calls are told apart under one heading.
 */
export const quirinopolisPnabSource = {
  kind: 'officialPage',
  slug: 'quirinopolis-pnab',
  name: 'Quirinópolis — Política Nacional Aldir Blanc 2026',
  isActive: false,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://quirinopolis.go.gov.br/politica-nacional-aldir-blanc-2026/',
  discovery: { hops: 'documentsUnderHeadings' },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Campina Grande do Sul-PR (2026-11-18): each call is on APPorte (`app.apporte.me/edital/…`), a
 * host the reader never follows (APPorte publishes no terms; its robots bar `/wp-admin/` only).
 * Off until a call page on another host is read.
 */
export const campinaGrandeDoSulCultureSource = {
  kind: 'officialPage',
  slug: 'campina-grande-do-sul-cultura',
  name: 'Campina Grande do Sul — projetos culturais',
  isActive: false,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://campinagrandedosul.pr.gov.br/projetos-culturais',
  discovery: { hops: 'callPage', callPageUrlParts: ['app.apporte.me/edital/'] },
  documentUrlParts: ['app.apporte.me/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Telêmaco Borba-PR (2026-11-18): one page per year ("Lei Aldir Blanc - 2026"), not named by the
 * year alone (`callPagesOnYearPages`), each holding every call's files (127 in 2026). Off until
 * a year page's calls are told apart.
 */
export const telemacoBorbaPnabSource = {
  kind: 'officialPage',
  slug: 'telemaco-borba-pnab',
  name: 'Telêmaco Borba — Lei Aldir Blanc',
  isActive: false,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl:
    'https://telemacoborba.pr.gov.br/index.php/informacoes/incentivo-cultural/lei-aldir-blanc',
  discovery: { hops: 'callPage', callPageUrlParts: ['/lei-aldir-blanc/'] },
  documentUrlParts: ['/images/pdfs/aldir_blanc_'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Centro Cultural Justiça Federal (TRF2, 2026-11-16): its notices are linked as "Regulamento", no
 * call named or numbered, beside a law-student prize. Off until a title comes from the file.
 */
export const ccjfOccupationSource = {
  kind: 'officialPage',
  slug: 'ccjf-ocupacao',
  name: 'CCJF — projetos e ocupação',
  isActive: false,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://ccjf.trf2.jus.br/sobre-o-ccjf/projetos',
  discovery: { hops: 'documentsOnListing' },
  documentUrlParts: ['/sites/default/files/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Profice 5th edition (SEEC-PR, 2026-11-16): a page per edition whose links carry no call number,
 * so no file names its call. Off until a call is named some other way.
 */
export const paranaProficeSource = {
  kind: 'officialPage',
  slug: 'pr-profice-5',
  name: 'SEEC-PR — Profice 5ª edição',
  isActive: false,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://www.cultura.pr.gov.br/PROFICE/Pagina/Profice-5a-Edicao',
  discovery: { hops: 'documentsOnListing' },
  documentUrlParts: ['/arquivos_restritos/files/documento/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Firjan Sesi RJ (2026-11-16): its headings are blocks over several calls, not calls (Mosaico Rio
 * 2027 closed 08/09/2026, for companies). Off until calls are told apart inside a block.
 */
export const firjanSesiCultureSource = {
  kind: 'officialPage',
  slug: 'firjan-sesi-editais-culturais',
  name: 'Firjan Sesi RJ — editais culturais',
  isActive: false,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl:
    'https://www.firjan.com.br/sesi/qualidade-de-vida/guia-sesi-cultural/editais-culturais/default.htm',
  discovery: { hops: 'documentsUnderHeadings' },
  documentUrlParts: ['/data/files/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Sesc national, Mostra Sesc de Cinema (2026-11-16): one "Acesse o edital" link with no call
 * number, so it names no call. Closed 31/03/2026, next March 2027. Off until a call is named some
 * other way.
 */
export const sescCinemaShowcaseSource = {
  kind: 'officialPage',
  slug: 'sesc-mostra-de-cinema',
  name: 'Sesc — Mostra Sesc de Cinema',
  isActive: false,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://www.sesc.com.br/cultura/mostra-sesc-de-cinema/',
  discovery: { hops: 'documentsOnListing' },
  documentUrlParts: ['cdnsesc.azureedge.net/assets/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Sesc national, Prêmio Sesc de Literatura (2026-11-16): as the Mostra, one "Edital 2026" link with
 * no call number. Closed 02/03/2026, next February 2027. Off until a call is named otherwise.
 */
export const sescLiteraturePrizeSource = {
  ...sescCinemaShowcaseSource,
  slug: 'sesc-premio-de-literatura',
  name: 'Sesc — Prêmio Sesc de Literatura',
  listingUrl: 'https://www.sesc.com.br/cultura/premio-sesc-de-literatura/',
} satisfies Source;

/**
 * Sesc RN (2026-11-16): no culture call since 2024, and those posted no result, so each would be
 * read (paid) as if open. Off until a past year's call with no result is skipped.
 */
export const sescRioGrandeDoNorteSource = {
  kind: 'officialPage',
  slug: 'sesc-rn-editais',
  name: 'Sesc RN — editais de cultura',
  isActive: false,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://sescrn.com.br/editais/',
  discovery: { hops: 'callPage', callPageUrlParts: ['/edital-cultura/'] },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Fortaleza'),
} satisfies Source;

/**
 * Fundação Franklin Cascaes (Florianópolis, 2026-11-16): the listing mixes years and its links
 * carry no call number, so no file names its call. Off until a call is dated from its PDF.
 */
export const florianopolisFranklinCascaesSource = {
  kind: 'officialPage',
  slug: 'florianopolis-franklin-cascaes',
  name: 'Florianópolis — Fundação Franklin Cascaes, editais',
  isActive: false,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://www.pmf.sc.gov.br/entidades/franklincascaes/index.php?pagina=goveditais',
  discovery: { hops: 'documentsOnListing' },
  documentUrlParts: ['/arquivos/editais/pdf/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Campo Grande Fundac: `/fundac/` redirected to tourism (2026-11-16) and failed once, then answered
 * in 4 s (2026-11-18); its parts are unmeasured. Applications are on `maiscultura-editais`. Off
 * until measured.
 */
export const campoGrandeFundacSource = {
  kind: 'officialPage',
  slug: 'campo-grande-fundac',
  name: 'Campo Grande — Fundac',
  isActive: false,
  robotsCheckedOn: '2026-11-16',
  termsCheckedOn: '2026-11-16',
  listingUrl: 'https://www.campogrande.ms.gov.br/fundac/',
  discovery: { hops: 'callPage', callPageUrlParts: ['-2026/', '/edital-'] },
  documentUrlParts: ['cdn.campogrande.ms.gov.br'],
  timeZone: ianaTimeZone.parse('America/Campo_Grande'),
} satisfies Source;

/**
 * Pelotas-RS culture publications: each notice titled with its posting date ("28/09/2026 - EDITAL
 * Nº 008-2026 - …"); files on `sai4.pelotas.com.br`, whose `robots.txt` answers its app page
 * (no rules). Robots allow all; no terms (`/termos-de-uso` serves the home page).
 */
export const pelotasCultureSource = {
  kind: 'officialPage',
  slug: 'pelotas-cultura-publicacoes',
  name: 'Pelotas — publicações da cultura',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://www.pelotas.com.br/publicacoes/cultura',
  discovery: { hops: 'documentsOnListing' },
  documentUrlParts: ['sai4.pelotas.com.br/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Indaiatuba-SP PNAB, phase two: a heading per call; "Anexos - Resoluções" heads 2024 resolutions,
 * so only headings naming an "edital" are calls. The URL names the phase: re-point it for the
 * next one. `robots.txt` and terms 404.
 */
export const indaiatubaPnabSource = {
  kind: 'officialPage',
  slug: 'indaiatuba-pnab-fase-dois',
  name: 'Indaiatuba — PNAB, fase dois',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://cultura.indaiatuba.sp.gov.br/pnab/fase-dois/',
  discovery: { hops: 'documentsUnderHeadings' },
  callTitleParts: ['edital'],
  documentUrlParts: ['/pnab/anexos/', 'indaiatuba.sp.gov.br/download/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Imperatriz-MA Fundação Cultural: one page per PNAB call (`/pnab-…`), printing its window; files
 * on the city portal over http (`novo.imperatriz.ma.gov.br`, whose `robots.txt` answers a page).
 * Robots: the Cloudflare preamble, no rule; no terms.
 */
export const imperatrizFciSource = {
  kind: 'officialPage',
  slug: 'imperatriz-fci-pnab',
  name: 'Imperatriz — Fundação Cultural, PNAB',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://www.culturaimperatriz.com.br/',
  discovery: { hops: 'callPage', callPageUrlParts: ['/pnab-'] },
  documentUrlParts: ['imperatriz.ma.gov.br/media/site/notify/fci/'],
  timeZone: ianaTimeZone.parse('America/Fortaleza'),
} satisfies Source;

/**
 * Jequié-BA PNAB: every 2026 notice and its results on one page beside the council's minutes;
 * Editais 01–04/2026 have results posted. Robots allow all; privacy page only.
 */
export const jequiePnabSource = {
  kind: 'officialPage',
  slug: 'jequie-pnab',
  name: 'Jequié — PNAB',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://www.jequie.ba.gov.br/pnab/',
  discovery: { hops: 'documentsOnListing' },
  documentUrlParts: ['/storage/files/'],
  timeZone: ianaTimeZone.parse('America/Bahia'),
} satisfies Source;

/**
 * Barbacena-MG PNAB: one page per call (`/cultura/pnab/pnab01`…), its notice under `editais/`,
 * annexes under `anexoNN/` (the call pages share `/cultura/pnab/`, so the file parts are narrower).
 * `robots.txt` 404; terms pages empty.
 */
export const barbacenaPnabSource = {
  kind: 'officialPage',
  slug: 'barbacena-pnab',
  name: 'Barbacena — PNAB',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://www.barbacena.mg.gov.br/cultura/pnab/',
  discovery: { hops: 'callPage', callPageUrlParts: ['/cultura/pnab/pnab0'] },
  documentUrlParts: ['/cultura/pnab/editais/', '/cultura/pnab/anexo'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Ferraz de Vasconcelos-SP PNAB: notices titled only "Edital Nº 001-2026", each with its annexes.
 * Robots allow all; no terms.
 */
export const ferrazDeVasconcelosPnabSource = {
  kind: 'officialPage',
  slug: 'ferraz-de-vasconcelos-pnab',
  name: 'Ferraz de Vasconcelos — editais PNAB',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://cultura.ferrazdevasconcelos.sp.gov.br/editais-pnab/',
  discovery: { hops: 'documentsOnListing' },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Varginha-MG Fundação Cultural PNAB: Chamamentos 01–04/2026 with their annexes. Robots bar
 * `/wp-admin/` only; privacy page on personal data only.
 */
export const varginhaPnabSource = {
  kind: 'officialPage',
  slug: 'varginha-fundacao-cultural-pnab',
  name: 'Varginha — Fundação Cultural, PNAB',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://fundacaoculturaldevarginha.com.br/pnab/',
  discovery: { hops: 'documentsOnListing' },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Bragança-PA PNAB, second cycle (about one call a year). The URL names the cycle: re-point it
 * for the next one. Robots allow all; an LGPD page only.
 */
export const bragancaPnabSource = {
  kind: 'officialPage',
  slug: 'braganca-pa-pnab',
  name: 'Bragança (PA) — PNAB 2º ciclo',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://braganca.pa.gov.br/pnab-2o-ciclo/',
  discovery: { hops: 'documentsOnListing' },
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Belem'),
} satisfies Source;

/**
 * Guarabira-PB: each call an image card with no text, so its title is the call page's
 * `f1-l-3` line (its `<h1>` is the city's name). The call pages' folder names the year
 * (`…-2026/`): re-point it yearly. Robots allow all; privacy portal only.
 */
export const guarabiraPnabSource = {
  kind: 'officialPage',
  slug: 'guarabira-pnab',
  name: 'Guarabira — Lei Aldir Blanc',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://guarabira.pb.gov.br/lei-aldir-blanc',
  discovery: {
    hops: 'callPage',
    callPageUrlParts: ['/editais-lei-aldair-blanc-2026/'],
    callTitleOnCallPage: true,
    callPageTitleClass: 'f1-l-3',
  },
  documentUrlParts: ['/storage/content/publicacoes/editais-lei-aldair-blanc-'],
  timeZone: ianaTimeZone.parse('America/Fortaleza'),
} satisfies Source;

/**
 * Porto Nacional-TO PNAB: notices on the vendor's Google Cloud bucket (`robots.txt` 404). The
 * URL names the year: re-point it yearly. Its `robots.txt` answers a page (no rules); no terms.
 */
export const portoNacionalPnabSource = {
  kind: 'officialPage',
  slug: 'porto-nacional-pnab',
  name: 'Porto Nacional — PNAB',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://portonacional.to.gov.br/concursos/2026/pnab',
  discovery: { hops: 'documentsOnListing' },
  documentUrlParts: ['storage.googleapis.com/server-tocantins/portonacional/'],
  timeZone: ianaTimeZone.parse('America/Araguaina'),
} satisfies Source;

/**
 * Santos-SP PNAB 2026: a heading per call, its notice and annexes below (links carry no call
 * number, so headings name them). The URL names the year: re-point it yearly. Robots and terms
 * 404.
 */
export const santosPnabSource = {
  kind: 'officialPage',
  slug: 'santos-pnab-2026',
  name: 'Santos — PNAB 2026',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl:
    'https://www.santos.sp.gov.br/?q=institucional/politica-nacional-aldir-blanc-pnab-2026',
  discovery: { hops: 'documentsUnderHeadings' },
  documentUrlParts: ['/portal_files/SECULT/aldir-blanc/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Itapema-SC culture news: cards ("Cultura 13/10/2025 CHAMAMENTO PÚBLICO Nº 033/2025 Leia mais"),
 * so only cards naming a call are opened, the title comes from the post, and a post linking no
 * notice is no call. Robots bar some bots by name, none of ours; privacy page only.
 */
export const itapemaCultureSource = {
  kind: 'officialPage',
  slug: 'itapema-cultura',
  name: 'Itapema — Cultura',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://www.itapema.sc.gov.br/cultura/',
  discovery: {
    hops: 'callPage',
    callPageUrlParts: ['/cultura/'],
    callPageNeedsNotice: true,
    callTitleOnCallPage: true,
  },
  callTitleParts: ['chamamento', 'edital', 'credenciamento'],
  documentUrlParts: ['/wp-content/uploads/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Fundação Biblioteca Nacional's literary prize on gov.br (Volto, as IPHAN's): a page per edition
 * (`premio-literario-2026`), notice and lists as files on it. Each edition opens mid-year and posts
 * its winners by November, so it is kept only until then. Its translation grants (foreign
 * publishers) and research grants are left out: not calls for creators.
 */
export const bnLiteraryPrizeSource = {
  kind: 'officialPage',
  slug: 'bn-premio-literario',
  name: 'Biblioteca Nacional — Prêmio Literário',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://www.gov.br/bn/pt-br/acesso-a-informacao-2/editais/premio-literario',
  discovery: {
    hops: 'callPage',
    callPageUrlParts: ['/editais/premio-literario/premio-literario-20'],
  },
  documentUrlParts: ['/bn/pt-br/acesso-a-informacao-2/editais/premio-literario/'],
  timeZone: ianaTimeZone.parse('America/Sao_Paulo'),
} satisfies Source;

/**
 * Instituto Cultural Vale's national call (Lei Rouanet sponsorship, applications in April–May) and
 * its cultural spaces' calls, a page each, files in `wp-content/uploads`. The national call's page
 * is rewritten for each edition at the same URL: a later edition finds the first one's call notice
 * (`externalId` is the page URL). No terms page; robots WordPress default.
 */
export const valeCulturalInstituteCallsSource = {
  kind: 'officialPage',
  slug: 'instituto-cultural-vale-editais',
  name: 'Instituto Cultural Vale — editais',
  isActive: true,
  robotsCheckedOn: '2026-11-18',
  termsCheckedOn: '2026-11-18',
  listingUrl: 'https://institutoculturalvale.org/editais/',
  discovery: {
    hops: 'callPage',
    callPageUrlParts: [
      '/editais/chamada-instituto-cultural-vale/',
      '/editais/editais-dos-espacos-culturais/',
    ],
  },
  documentUrlParts: ['institutoculturalvale.org/wp-content/uploads/'],
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
  recifeCultureSource,
  spcineCallsSource,
  spcinePnabSource,
  spcineFsaSource,
  badescCultureSource,
  portoAlegreCultureSource,
  sesiSpCultureSource,
  goiasMunicipalitiesMapasSource,
  pauloAfonsoSeculteSource,
  paraibaFunescSource,
  mageSeculteSource,
  balnearioCamboriuFcbcSource,
  itajaiFciSource,
  lagoaSantaMapasSource,
  saoBernardoMapasSource,
  londrinaMapasSource,
  bahiaPnabPlatformSource,
  piauiPnabPlatformSource,
  amazonasPnabPlatformSource,
  amapaPnabPlatformSource,
  tocantinsPnabPlatformSource,
  macapaPnabPlatformSource,
  maringaMapasSource,
  santaLuziaMapasSource,
  rioBrancoCulturaSource,
  caruaruOportunidadesSource,
  portoVelhoFunculturalSource,
  palmasFcpSource,
  clovisSalgadoFoundationSource,
  matoGrossoDoSulFcmsSource,
  erechimPnabSource,
  araxaCalmonBarretoSource,
  iphanOpenCallsSource,
  museuDoIndioCallsSource,
  ufuProexcCultureSource,
  sescRoraimaArtistCredentialingSource,
  sescRoraimaVisualArtsSource,
  rioGrandeDoNorteFjaSource,
  espiritoSantoSecultCallsSource,
  espiritoSantoSecultCallPagesSource,
  balsasCultureSource,
  coronelFabricianoCultureSource,
  itaperunaCultureSource,
  araguainaCultureSource,
  saoPauloCultureSource,
  sesiMinasCultureNewsSource,
  rioGrandeDoNortePnabSource,
  rioGrandeDoNorteAudiovisualSource,
  paraFcpSource,
  escadaPnabSource,
  curveloPnabSource,
  santaLuziaMaranhaoPnabSource,
  tramandaiPnabSource,
  sapirangaCallsSource,
  santoAntonioDoDescobertoSource,
  quirinopolisPnabSource,
  campinaGrandeDoSulCultureSource,
  telemacoBorbaPnabSource,
  ccjfOccupationSource,
  paranaProficeSource,
  firjanSesiCultureSource,
  sescCinemaShowcaseSource,
  sescLiteraturePrizeSource,
  sescRioGrandeDoNorteSource,
  florianopolisFranklinCascaesSource,
  campoGrandeFundacSource,
  pelotasCultureSource,
  indaiatubaPnabSource,
  imperatrizFciSource,
  jequiePnabSource,
  barbacenaPnabSource,
  ferrazDeVasconcelosPnabSource,
  varginhaPnabSource,
  bragancaPnabSource,
  guarabiraPnabSource,
  portoNacionalPnabSource,
  santosPnabSource,
  itapemaCultureSource,
  bnLiteraryPrizeSource,
  valeCulturalInstituteCallsSource,
];
