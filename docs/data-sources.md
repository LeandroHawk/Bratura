# Data sources

Where call notices (editais) come from, what we may collect, and what we never touch. How Firecrawl reads the
pages and PDFs: `docs/integrations/firecrawl.md`. Sources verified on **2026-11-07**; recheck a
source's robots.txt and terms before adding or changing it.

## Rules

- **Only sources that allow it**: robots.txt and terms read and recorded before a source enters the
  `sources` table. A source never enters automatically: it is written in
  `packages/backend/convex/model/sources/registry.ts`, with the days its robots.txt and terms were
  read, and copied to a deployment by `sources:registerSource` (the same command changes it). The
  competition excludes "coleta de dados que viole os termos do site de origem ou exponha dados
  pessoais" (5.2) and scraping that exposes personal data (6.8).
- **Eligibility, amounts and documents live only in the call's PDF.** The Mapas API gives name,
  dates and the PDF link; everything a creator decides on is extracted from the PDF.
- **Nothing is invented**: every value shown has its source link; a field not found is `null`,
  shown as "não informado" (`docs/security.md` §3 for how extraction is checked).
- **No personal data from sources**: never display an individual's name taken from a source (the
  Mapas `owner.name` can be a private person). Derive the issuing body from the PDF text.
- **News sites are only a signal** that a call opened: never store their text, always fetch the
  official source.

## Mapas Culturais API (primary, structured)

Public JSON, no auth. Instances confirmed working:

| Instance | Host | Open on 2026-11-07 | Open on 2026-11-13 | Zone it sends |
| --- | --- | --- | --- | --- |
| Federal | `mapa.cultura.gov.br` | 64 | 59 | `Etc/GMT+3` |
| Ceará | `mapacultural.secult.ce.gov.br` | 30 | 35 | `America/Fortaleza` |
| Pernambuco | `mapacultural.pe.gov.br` | 15 | 11 | `America/Recife` |
| Santo André-SP | `culturaz.santoandre.sp.gov.br` | 1 | 3 | `Etc/GMT+3` |
| Canindé-CE | `mapacultural.caninde.ce.gov.br` | 0 (monitor) | 0 | — |

**The list of instances** is the `mapasculturais` README on GitHub
(`https://github.com/mapasculturais/mapasculturais`, branch `develop`, sections "Instalações em
nível federal ou internacional", "estaduais", "municipais", "outras"). Every listed host was probed
on 2026-11-14. São Paulo state: **Mauá** (`mapacultural.maua.sp.gov.br`, 3 open, 1 with documents;
17 opened in 2026) and Itatiba (`mapacultural.itatiba.sp.gov.br`, 0 open; 12 in 2026, 2 with
documents) work; Campinas, Limeira and Santo Anastácio answer with nothing open. Listed but dead:
Guarujá, Guarulhos, Itu and São Caetano (no DNS); São Bernardo and Osasco (no answer); SPCultura
(`spcultura.prefeitura.sp.gov.br`, no byte in 120 s, third check). No Baixada Santista city runs a
working instance.

`robots.txt` answers 404 on all five (2026-11-13): nothing declared. Terms: see Rules; Ceará's are a
PDF (`termo_de_uso_-_mapa_cultural_do_ceara_v1.0.pdf`), the others publish none found.

**Added on 2026-11-14** (Mauá above, plus the instances of the GitHub list with a call open that day):

| Instance | Host | Call notices on 2026-11-14 (with documents) | Zone it sends |
| --- | --- | --- | --- |
| Espírito Santo (state portal, also hosts Viana, Vila Velha, Divino São Lourenço) | `mapa.cultura.es.gov.br` | 11 (7) | `America/Sao_Paulo` |
| CIM-AMFRI-SC (municipal consortium, e.g. Bombinhas) | `mapacultural.cim-amfri.sc.gov.br` | 8 (4) | `Etc/GMT+3` |
| Aparecida de Goiânia-GO | `portaldacultura.aparecida.go.gov.br` | 8 (7) | `Etc/GMT+3` |
| João Pessoa-PB | `jpcultura.joaopessoa.pb.gov.br` | 1 (1) | `America/Recife` |
| Natal-RN | `mapacultural.natal.rn.gov.br` | 2 (2) | `Etc/GMT+3` |
| Parauapebas-PA | `mapacultural.parauapebas.pa.gov.br` | 2 (1) | `Etc/GMT+3` |
| Nova Lima-MG | `mapacultural.novalima.mg.gov.br` | 2 (2) | `Etc/GMT+3` |
| Paraíba (state) | `mapacultural.pb.gov.br` | 1 (1) | `America/Recife` |
| Sergipe (state) | `mapacultural.se.gov.br` | — | — |

`robots.txt` answers 404 on all nine (2026-11-14). Terms: each publishes `/termos-de-uso`, the Mapas
template (account, password, personal data, liability), with no clause on automated access or reuse
of call data; Parauapebas publishes none found. **Sergipe** answers from Brazil but the cloud
ingestion fails ("error sending request" after ~30 s), as Pernambuco and Maringá do: likely non-BR IPs
blocked; registered, reading it needs a route from Brazil. **Aracaju**
(`mapacultural.aracaju.se.gov.br`, 1 open) is not added: its `robots.txt` answers HTTP 500, so its
rules cannot be read; recheck before adding. Instances of the list with nothing open on 2026-11-14
(Santa Luzia-MG, Lagoa Santa-MG; Pará and Cianorte-PR were added on 2026-11-16) are not added yet; Lagoa Santa sends Cloudflare
content signals, a team call as for Mongaguá.

**Added on 2026-11-15** (municipalities that run an instance: the first three over 300k
inhabitants, Arapiraca between 150k and 300k; none has a call open that day, so the first
ingestion recorded 0 and they wait for PNAB Ciclo 3):

| Instance | Host | Opportunities closing in 2026 | Zone it sends |
| --- | --- | --- | --- |
| Petrolina-PE | `mapacultural.petrolina.pe.gov.br` | 13 | `Etc/GMT+3` |
| Paulista-PE (not on the GitHub list) | `mapacultural.paulista.pe.gov.br` | 6 | `America/Recife` |
| Anápolis-GO | `culturaemrede.anapolis.go.gov.br` | 5 | `Etc/GMT+3` |
| Arapiraca-AL (not on the GitHub list) | `mapacultural.arapiraca.al.gov.br` | 11 | `Etc/GMT+3` |
| Cianorte-PR (added 2026-11-16) | `cultura.cianorte.pr.gov.br` | 7 (Chamamento 11/2026 open to 18/11) | `Etc/GMT+3` |
| Itupiranga-PA (added 2026-11-16) | `cultura.itupiranga.pa.gov.br` | 4 | `America/Belem` |
| Itatiba-SP (added 2026-11-16) | `mapacultural.itatiba.sp.gov.br` | 12 | `Etc/GMT+3` |
| Pará (state; carries Belém, Santarém, Ananindeua; added 2026-11-16) | `mapacultural.pa.gov.br` | 64 (1 user item "open" to 2111) | `America/Belem` |
| Goiás (state, Mapa Goiano; added 2026-11-16) | `mapagoiano.cultura.go.gov.br` | 4 (1 agent's "Agenda aberta" to 2034) | `Etc/GMT+3` |
| Tocantins (state; added 2026-11-16) | `mapa-cultural.to.gov.br` | 3 | `Etc/GMT+3` |

`robots.txt` answers the app's HTML page on all four (2026-11-15): nothing declared. Terms:
Petrolina and Paulista serve `/termos-de-uso`, rendered by script (the Mapas template, not read in
full); Anápolis and Arapiraca publish none found (Arapiraca's `/termos-de-uso` is a 404). Cianorte
(2026-11-16): `robots.txt` 404; no terms at `/termos-de-uso`, `/politica-de-privacidade` or `/lgpd`.
The five added later that day: `robots.txt` 404 on all; Itupiranga, Pará and Goiás serve the Mapas
`/termos-de-uso` ("Não copiar … conteúdo com dados pessoais de outros usuários": personal data only,
no clause on automated access or reuse of call data); Itatiba and Tocantins publish none found.
Their far-future items (2111, 2034) are open-ended, so no credits go to them.
Unlike the Pernambuco state instance, both Pernambuco cities answer the cloud ingestion (under 1 s).

**CultBR Editais** (`culteditais.cultura.gov.br`, added on 2026-11-15): the Ministry of Culture's
Mapas for municipalities with no instance of their own, mostly PNAB. 261 opportunities closing in
2026, 13 open that day (zone `Etc/GMT+3`), none named as a phase, so it reads as is. The city is not
in the API: `owner` is a clerk's personal agent (never read), so the city comes from
`shortDescription` or the name ("PNAB Quixelô"). Of the 13, `documentsWorthReading` reads 4; 2 have
no files and 7 only annexes or a notice with an unmatched name (`pnab-assinada-2.pdf`), which wait
for the admin review. `robots.txt` answers 404: nothing declared. Terms: `/termos-de-uso` is the
federal Mapa da Cultura's (account, password, LGPD; forbids copying other users' personal data), with
no clause on automated access or reuse of call data, 2026-11-15.

**Agente Cultural** (`agentecultural.com.br`, added on 2026-11-15): a Mapas instance run by a
private vendor for municipalities of Goiás and Rondônia (19 towns, 14 under 100k inhabitants; the
only municipal aggregator found for Goiás). 43 opportunities closing in 2026, none open that day
(zone `Etc/GMT+3`); each name starts with its city ("Padre Bernardo-GO - Edital de Chamamento Público
001/2026 - …"). `robots.txt` answers the app's HTML page: nothing declared. Terms: `/termos-de-uso`
is the Mapas template's view, rendered by script (not read in full, as Petrolina and Paulista).

```
GET https://{host}/api/opportunity/find
  ?@select=id,name,shortDescription,registrationFrom,registrationTo,singleUrl
  &@files=(rules,downloads):url
  &registrationFrom=LTE({today})
  &registrationTo=GTE({today})
  &@order=registrationTo ASC
```

- Always an explicit `@select`: `@select=*` returned non-JSON. `{today}` is `YYYY-MM-DD`. **Never
  `owner`**: it can be a private person, and nothing of it is used.
- Dates come as `{ "date": "2026-11-15 23:59:00.000000", "timezone": "Etc/GMT+3", … }`: a wall clock
  in that zone. The zone is a place (`America/Recife`) or a fixed offset (`Etc/GMT+3` is UTC−3: POSIX
  inverts the sign); `Intl.supportedValuesOf` omits the latter, `Intl.DateTimeFormat` reads both.
- **`00:00` is mostly "no deadline"**: most federal calls at `00:00` close on `2111-01-01` (also
  2050, 2052, 2076, 2100), a sentinel for an open-ended form, not a date. **Real midnight closings
  are rare but exist** (first ingestion: 2 CE, 1 federal): Mapas closes the form at that minute, so
  "15/11 00:00" means "until the end of the 14th", and a screen must show the previous day.
- `"@files:rules": { "url": … }` is the one file Mapas names "Regulamento", usually the notice
  itself; `"@files:downloads": [{ "url": … }]` is every other attachment, absent when there is none
  (41 of 59 federal calls): annexes (up to 37 on one call), `.docx` forms and media (`.mp4`, `.mp3`,
  `.jpg`). **Read both**: on 2026-11-16, 101 of the 2026 opportunities on the registered instances
  had their notice only in `rules` (culteditais 49, agentecultural 15, CE 13, ES 10), and asking
  for `rules` raised the calls with a notice worth reading from 332 to 656 of 800. A call notice
  stores the text files in order, `rules` first (`documentUrls`), media left out; which one is the
  call notice is still decided by name when documents are read.
- One federal summary had 5,753 characters: past the contract's 5,000, it is cut and marked "…".
- Filters: `EQ`, `LIKE` (with `*`), `BET(a,b)`, `GTE`, `LTE`, `AND(...)`, `OR(...)`, `!`.
- **Dirty data**: payment forms ("habilitação de pagamento"), council elections, Mapas
  opportunities created by individuals. Classification drops them from creator-facing lists.
- SP capital (`spcultura.prefeitura.sp.gov.br`) did not answer in 90 s: keep as inactive, retry.

## Official pages (plain fetch; Firecrawl reads only the documents)

Read by `ingestion:ingestOfficialPage` (`model/officialPage/`): the listing and call pages are
fetched as HTML on the listing's own host, so finding calls costs no credits. Registering one means
choosing its `discovery` and `documentUrlParts` from the site's real links (measured 2026-11-15 on
the rows marked so below).

| Source | URL | robots | terms |
| --- | --- | --- | --- |
| Bahia FUNCEB (measured 2026-11-15) | `https://www.ba.gov.br/fundacaocultural/editais-2026`: one page per call | allows (only `serverinfo.json` disallowed) | none published (`ba.gov.br` answers any path with its app shell), 2026-11-15 |
| Rio de Janeiro city SMC (measured 2026-11-15) | `https://cultura.prefeitura.rio/`: one page per call, the notice named "REGULAMENTO" | allows except wp-admin | not read: not registered, its call pages share no URL part but the root |
| Minas Gerais Secult (measured 2026-11-15) | `https://www.secult.mg.gov.br/editais/editais-pnab/editais-pnab` and `/editais/fundo-estadual-de-cultura-fec/editais-fec`: the listing links the documents (`?download=`) | 404: nothing declared | only a privacy policy, about its visitors' data, 2026-11-15 |
| Maranhão Secma (measured 2026-11-15) | `https://cultura.ma.gov.br/programas-ou-campanhas/editais-secma`: the listing links the PDFs | allows (Semrush, Petal disallowed) | content under CC BY 4.0, 2026-11-15 |
| Funarte (measured 2026-11-15) | `https://www.gov.br/funarte/pt-br/fomento/chamadas-2026`: one page per call, the year in the path; Memória das Artes is a folder one level down, its own source. Not `/fomento/chamadas-abertas` (302 to paths that 404) | allows (gov.br disallows only other organs' paths and form views) | gov.br portal: CC BY-ND 3.0 (`gov.br/pt-br/termos-de-uso`), 2026-11-15 |
| Ministério da Cultura, open calls (measured 2026-11-15) | `https://www.gov.br/cultura/pt-br/assuntos/editais/inscricoes-abertas`: one page per call under the same path; the Rouanet program calls are listed only here (not on federal Mapas); a call moves to another folder when it closes | allows (gov.br: no rule for ClaudeBot or GPTBot) | gov.br portal: CC BY-ND 3.0, 2026-11-15 |
| Nova Iguaçu Semcult (measured 2026-11-15) | `https://www.novaiguacu.rj.gov.br/semcult/pnab/`: the listing links the documents, numbered in the link text, many as `http://` | allows (WordPress default: `/wp-admin/` disallowed) | none published, 2026-11-15 |
| Salvador FGM (measured 2026-11-15) | `https://fgm.salvador.ba.gov.br/editais-abertos/`: only open calls, one page per call, each linked as "Clique aqui!" (the page's own heading names the call) | allows (WordPress default: `/wp-admin/` disallowed) | none published (`/lgpd/` explains the LGPD law; no clause on automated access or reuse), 2026-11-15 |
| Jundiaí Fundação Casa da Cultura (measured 2026-11-15) | `https://cultura.jundiai.sp.gov.br/editais-e-regulamentos/`: one heading per call, its documents under it, labelled "Edital", "PDF", "Anexo I"; closed calls under "ENCERRADOS" | 404: nothing declared | only a privacy policy, about its visitors' data (Google Analytics), 2026-11-15 |
| Jaboatão dos Guararapes PNAB Ciclo 2 (measured 2026-11-15) | `https://viver.jaboatao.pe.gov.br/pnab/pnab-ciclo-2`: one heading per call ("Edital 002/2026 - …"); a page for one cycle | 404: nothing declared | none published, 2026-11-15 |
| Cambé Secretaria de Cultura PNAB Ciclo II (measured 2026-11-15) | `https://www.cambe.pr.gov.br/index.php/secretarias/secretarias/cultura/lei-aldir-blanc/pnab-ciclo-ii/`: one page per call (`/pnab-ciclo-ii/edital-0…`), documents under `/index.php/download/`; a page for one cycle. 2 calls in 2026 (Editais 001 and 005/2026), both closed that day | allows (WordPress default: `/wp-admin/` disallowed) | only an LGPD privacy page (`/lgpd-2/`), no clause on automated access or reuse, 2026-11-15 |
| Delmiro Gouveia PNAB (measured 2026-11-15) | `https://delmirogouveia.al.gov.br/editais-pnab/`: the listing links every notice PDF itself, the call number in the link text ("EDITAL DE CHAMAMENTO PÚBLICO Nº 02-2026 …"); not tied to one cycle. 2 calls in 2026, both closed on 13/11 | allows (WordPress default, plus `/wp-content/uploads/wpforms/` disallowed) | only a privacy page, no clause on automated access or reuse, 2026-11-15 |
| Estância Edital Cultural (measured 2026-11-15) | `https://editalcultural.estancia.se.gov.br/Editais`: one page per call (`/Editais/Details/N`), linked as "Acessar"; each file is a download handler (`/Arquivos/DownloadArquivos/?id=N`) named only by the bold text above its "Baixar" link. Apart from the city's `www.` host, which disallows everything. 12 items, Edital 022/2026 open until 23/11 | 404: nothing declared | none published, 2026-11-15 |
| Teixeira de Freitas SMIC PNAB (measured 2026-11-16) | `https://smic.teixeiradefreitas.ba.gov.br/grupo/pnab/`: one page per call (`/editais/edital-de-chamamento…`, `/editais/credenciamento-…`), documents under `/wp-content/uploads/`; the reviewers' credenciamento (to 2028) and the public `/perfis` pages are left out by the parts. 3 calls open that day (to 19/11, 27/11, 31/12) | allows (`/wp-admin/` disallowed) | only a privacy page (an LGPD consent for applicants' data), no clause on automated access, 2026-11-16 |
| Câmara dos Deputados, editais de seleção cultural (measured 2026-11-16) | `https://www2.camara.leg.br/a-camara/visiteacamara/cultura-na-camara/editais-de-selecao`: one page per yearly call (the 2026/27 one at `copy_of_edital-2025-2026`), which links the notice as a clean PDF; past editions are not linked. Edital 01/2026 (exhibitions for 2027) open to 30/11 | allows (form, search and legacy suffixes disallowed; no AI-named group) | §29: "Todas as informações publicadas no Portal da Câmara são de domínio público, gratuitas e podem ser reproduzidas desde que citada a fonte “Câmara dos Deputados”" (each call keeps its source link); §22 lets it block "sistemas automatizados ou robôs … que tentem imitar pessoas", and our user agent names itself, 2026-11-16 |
| Ponta Grossa SMC PNAB (measured 2026-11-15) | `https://cultura.pontagrossa.pr.gov.br/lei-aldir-blanc/`: one heading per call, every document linked as "clique aqui"; **off**: it times out from Convex (US East) and answers from Brazil, as Pernambuco | allows (WordPress default, plus `/wp-content/uploads/wpforms/` disallowed) | none published, 2026-11-15 |
| Paraná Seec (measured 2026-11-15) | `https://www.cultura.pr.gov.br/`: one page per call under `/Pagina/Edital-`, some renamed behind a same-host 301 | allows (Drupal default: `/core/`, `/user/`, `/search/` disallowed) | none published, 2026-11-15 |
| São Paulo city culture calls | `https://prefeitura.sp.gov.br/web/cultura/editais/` | allows all | not recorded here |
| Amigos da Arte (SP state calls) | `https://amigosdaarte.org.br/editais_/` (with the underscore; RSS at `/editais_/feed/`); the 4 calls of 2026 are closed | allows except wp-admin | not recorded here |
| Santos (SECULT: PNAB 2026, FACULT) | official pages with the PDFs; all 2026 calls closed (2026-11-14) | 404: nothing declared | not recorded here |
| Goiás government (craft fairs) | `https://goias.gov.br` (the fairs page is still to find) | allows except wp-admin | not recorded here |

Gap-fixing guidance (Portal do Empreendedor for MEI/CCMEI, SICAB via the state craft coordination,
the MinC calls page) is linked, not crawled; confirm final URLs before shipping.

**Festivals and fairs come as calls in the same sources**: Pernambuco's Carnaval / São João 2027
convocatória is on its Mapas instance; state craft-fair calls (Goiás, Espírito Santo, Paraná,
Fenearte) are PDFs on government sites, often reserving slots for individual artisans or MEI and
requiring SICAB and CCMEI; Amigos da Arte runs SP state festival calls (Difusão Cult, Revelando SP).
Small private fairs announced only on Instagram cannot be covered cleanly: community submissions,
later.

## Checked and not usable (2026-11-07)

| What | Finding |
| --- | --- |
| Guessed Mapas hosts | Guessed hosts for BA, GO, ES, SP, RS, MS and the Baixada Santista cities do not resolve; use the GitHub list (Mapas Culturais API above) |
| Espírito Santo fair sites | `aderes.es.gov.br`, `www.es.gov.br`, `secult.es.gov.br` return 404 for robots.txt: check each site before use |
| SMC Editais, Promac (`smceditais…`, `smcpromac…`) | Application systems (API 401): link to them, not sources |
| Fomento CultSP (`fomentocultsp.sp.gov.br/editais-vigentes`, SP state) | The state's list of open calls, but the page redirects to a login (`/auth/login`, 2026-11-14): link to it, not a source |
| SP state culture portal (`cultura.sp.gov.br`, Portal do Fomento) | Behind Incapsula (anti-bot); `proac.sp.gov.br` redirects there |
| Mongaguá, Guarujá, Itanhaém | Cloudflare content signals leave AI input undecided: a team call before use |
| ProAC (SP state, ~R$ 90 mi in 2026) | Applications closed 3/8; current official page not found |
| São José dos Campos | Uses Prosas: out |
| News (e.g. Catraca Livre) | robots allows except search and `wp-json`; a signal only, never stored |
| DOU via dados.gov.br | The API needs a token (401); the Imprensa Nacional open-data page did not answer. A key or an INLABS sign-up would be easy, but DOU only adds federal calls already in the federal Mapas instance |
| Querido Diário | Down from 2026-10-19 (HTTP 522); on 2026-11-14 one 200 then timeouts, terms page needs JavaScript; its robots says `Content-Signal: search=yes,ai-train=no,use=reference`; the API moved to `api.queridodiario.org.br`. Recheck later |
| Rouanet open data | SALIC API (`api.salic.cultura.gov.br`) 404; VerSalic "Serviço em migração"; the dados.turismo.gov.br dataset was last updated 2022-01-25; the Zenodo copy (CC-BY) covers 2010–2014. Pitch only |

Never use a team member's personal gov.br login to reach a source; an API key goes in the environment
variables, never in chat or the repo.

## Excluded (do not touch)

| Source | Why |
| --- | --- |
| Prosas | terms forbid "métodos de prospecção ou … extração de dados"; robots `Disallow: /`. Linking to a Prosas page is fine; copying or framing it is not |
| Sympla | ticketing (public tickets, not calls for exhibitors); its terms page returned 403 to automated access |
| in.gov.br / DOU | robots `Disallow: /` |
| Instagram / Facebook | terms |

## Open for brainstorming

New sources are welcome as proposals, with the robots.txt and terms check. Open now: which listed
Mapas instances to register (Mauá first for SP), where ProAC lists current calls, the Goiás fairs
page, and whether the demo shows recently closed SP calls marked as closed (most 2026 SP windows
closed June–September) while matching only lists open ones.