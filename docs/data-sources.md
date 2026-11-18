# Data sources

Where call notices (editais) come from, what we may collect, and what we never touch. How Firecrawl reads the
pages and PDFs: `docs/integrations/firecrawl.md`. Sources verified on **2026-11-07**; recheck a
source's robots.txt and terms before adding or changing it.

## Rules

- **Only sources that allow it**: robots.txt and terms read and recorded before a source enters the
  `sources` table. A source never enters automatically: it is written in
  `packages/backend/convex/model/sources/registry.ts`, with the days its robots.txt and terms were
  read, and copied to a deployment by `sources:registerSource` (the same command changes it). A
  `Crawl-delay` there is kept between the pages the reader fetches (`crawlDelaySeconds`); Firecrawl's
  document reads keep their own spacing (`firecrawlRequestSpacingMs`). The
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

**Sources that answer only from Brazil** (`answersOnlyFromBrazil` in the registry; 2026-11-16):
Pernambuco, Sergipe, São Bernardo do Campo and Maringá Mapas, Ponta Grossa, Secult Alagoas 2026 and Secec DF. They time out from
Convex (US East) in 30 s and answer from Brazil, so their listing, call pages and documents are
fetched by Firecrawl with a Brazilian location (1 credit per page;
`docs/integrations/firecrawl.md`, Decisions). Pernambuco and Ponta Grossa, off until then, are on
again. Secult Alagoas is off since 2026-11-17: Firecrawl cannot read it either (official pages
table). São Bernardo (2026-11-17) also sends an incomplete TLS chain (no Certum DV TLS G2 R39
intermediate, so curl and Node refuse it); Firecrawl's browser completes it (measured: its API JSON
intact, 1 credit), while a Node fetch with the intermediate pinned still times out from Convex.

**The list of instances** is the `mapasculturais` README on GitHub
(`https://github.com/mapasculturais/mapasculturais`, branch `develop`, sections "Instalações em
nível federal ou internacional", "estaduais", "municipais", "outras"). Every listed host was probed
on 2026-11-14. São Paulo state: **Mauá** (`mapacultural.maua.sp.gov.br`, 3 open, 1 with documents;
17 opened in 2026) and Itatiba (`mapacultural.itatiba.sp.gov.br`, 0 open; 12 in 2026, 2 with
documents) work; Campinas, Limeira and Santo Anastácio answer with nothing open. Listed but dead:
Guarujá, Guarulhos, Itu and São Caetano (no DNS); Osasco (no answer); São Bernardo answers from Brazil only, with an incomplete TLS chain (registered 2026-11-17, above); SPCultura
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
blocked. Since 2026-11-16 it is read through Firecrawl from Brazil (below). **Aracaju**
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
| Mapa Cultura Goiás (14 municipalities, privately run, operator not named; added 2026-11-17) | `mapa.culturagoias.com.br` | 1 open (Professor Jamil, Chamamento 06/2026, to 19/11) | `Etc/GMT+3` |
| Lagoa Santa-MG (added 2026-11-17) | `mapacultural.lagoasanta.mg.gov.br` | 7 (PNAB Ciclo 3 in public consultation to 14/12) | `Etc/GMT+3` |
| São Bernardo do Campo-SP (added 2026-11-17, through Firecrawl from Brazil) | `mapacultural.saobernardo.sp.gov.br` | 42 (CeMAM choirs' meeting open to 22/11) | `Etc/GMT+3` |
| Londrina-PR, "Londrina Cultura" (added 2026-11-18, through Firecrawl from Brazil: no GoGetSSL RSA DV CA intermediate sent) | `londrinacultura.londrina.pr.gov.br` | 27 (2 open: PNAB 003/2026 alternates' documents to 23/11, PROMIC selection committees to 30/11); the PROMIC page `portal.londrina.pr.gov.br/incentivo-cultura/promic/editais` lists the same calls behind "clique aqui" links | `Etc/GMT+3` |
| Maringá-PR (added 2026-11-17, through Firecrawl from Brazil) | `maringacultura.maringa.pr.gov.br` | 21 (4 open: Ocupação dos Espaços Culturais 2027, Bolsas Cultura Viva, CEU das Artes, Pontão de Cultura; its notices are named by SEI number, `sei-…-edital-…pdf`) | `Etc/GMT+3` |
| Santa Luzia-MG (added 2026-11-18) | `mapacultural.santaluzia.mg.gov.br` | 48 (none open; about half are council meetings, elections and appeal steps, skipped by title) | `America/Sao_Paulo` |

`robots.txt` answers the app's HTML page on all four (2026-11-15): nothing declared. Terms:
Petrolina and Paulista serve `/termos-de-uso`, rendered by script (the Mapas template, not read in
full); Anápolis and Arapiraca publish none found (Arapiraca's `/termos-de-uso` is a 404). Cianorte
(2026-11-16): `robots.txt` 404; no terms at `/termos-de-uso`, `/politica-de-privacidade` or `/lgpd`.
The five added later that day: `robots.txt` 404 on all; Itupiranga, Pará and Goiás serve the Mapas
`/termos-de-uso` ("Não copiar … conteúdo com dados pessoais de outros usuários": personal data only,
no clause on automated access or reuse of call data); Itatiba and Tocantins publish none found.
Their far-future items (2111, 2034) are open-ended, so no credits go to them.
Mapa Cultura Goiás (2026-11-17): `robots.txt` and `/termos-de-uso` 404; registered by the team's
decision with no terms published.
Lagoa Santa (2026-11-17): `robots.txt` allows `*` with `Content-Signal: search=yes,ai-train=no,use=reference`;
`/termos-de-uso` serves the Mapas template; nothing here trains a model, and each call is shown with
its source link: registered by the team's decision.
São Bernardo (2026-11-17, read with the intermediate added): `robots.txt` and `/termos-de-uso` 404.
Maringá (2026-11-17): `robots.txt` and `/termos-de-uso` 404. Two of its open items are a past call's
accountability ("Prestação de Contas …"), skipped by title.
Unlike the Pernambuco state instance, both Pernambuco cities answer the cloud ingestion (under 1 s).
Santa Luzia (2026-11-18): `robots.txt` 404; `/termos-de-uso` forbids copying other users' personal
data only, and no user profile is read.

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

Read by `ingestion:ingestOfficialPage` (`model/officialPage/`): the listing (HTML, or the JSON a
page fills itself from) and call pages are fetched on the listing's own host, so finding calls costs no credits (except a source that answers only from Brazil, above). Registering one means
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
| Sapé PNAB (measured 2026-11-16) | `https://sape.pb.gov.br/politica-nacional-aldir-blanc-pnab/`: one page per call (`/lei-aldir-blanc/edital-…`, `/lei-aldir-blanc/chamamento-publico-…`), notice under `/wp-content/uploads/`. 1 call recorded (Edital 008/2026, to 16/11); the older ones post results | allows (`/wp-admin/` disallowed) | `/termos-de-uso` 404; an LGPD privacy page ("fins comerciais razoáveis" is about contacting users), no clause on automated access, 2026-11-16 |
| Buíque PNAB 2026 (measured 2026-11-16) | `https://buique.pe.gov.br/pnab-2026/`: one heading per call over its notice (`/downloads/pnab/`), results under their own headings; a page per year. 3 calls (Editais 001–003/2026), all closed | allows (`/wp-admin/` disallowed) | only a privacy page, no clause on automated access, 2026-11-16 |
| Tijucas Lei Aldir Blanc (measured 2026-11-16) | `https://www.tijucas.sc.gov.br/especiais/lei-aldir-blanc`: every notice, rectification and result linked on one page, results on the SC gazette's `s3cache.dom.sc.gov.br`. Chamamentos 001 and 002/2026 post results: nothing recorded that day | allows (`/controle` disallowed) | none published, 2026-11-16 |
| Secult Goiás PNAB 2026 (measured 2026-11-16) | `https://goias.gov.br/cultura/pnab/edital-2026-pnab/`: one heading per call over its notice and annexes (`/cultura/wp-content/uploads/sites/25/`); a page per year. 2 calls (Ocupa Goiás Brasilidades & Futuros and MITsp 2027), closed 29/10 and 14/11 by their cronogramas | allows (`/wp-includes/`, a panel path disallowed) | only a privacy page, no clause on automated access, 2026-11-16 |
| Secult Alagoas 2026 (measured 2026-11-16) | `https://secult.al.gov.br/editais-e-concursos/editais-e-concursos-2026`: one download category per call (`chamamento-publico-n-…`, `-mostra-`), files as `task=download.send`; the incentive-law category left out; a listing per year. 2 calls recorded (Chamamentos 07 and 08/2026); the other 2026 calls post results. **Off** since 2026-11-17: it times out from Convex, and Firecrawl fails on it with every engine (`SCRAPE_ALL_ENGINES_FAILED`), even from Brazil with a 90 s timeout, while a plain request from Brazil answers in 3 s | allows (Joomla default) | none published, 2026-11-16 |
| Secec DF (measured 2026-11-16) | `https://www.cultura.df.gov.br/editais-abertos-1`: every notice on one page, extensionless files under `/documents/d/secec/`. 4 calls (Editais 14 and 15/2026, 21 and 27/2025) | allows all | none published (the footer links only the DF LGPD portal), 2026-11-16 |
| PNAB DF with Instituto OMNI (measured 2026-11-16) | `https://novosite.pnabdf.org.br/`: one page per call (`/editais/edital-…`), notice first. 3 calls (Editais 19, 20, 21/2026) | allows all | none published, 2026-11-16 |
| Casa das Rosas (Poiesis; measured 2026-11-16) | `https://casadasrosas.org.br/editais/`: one page per call (`/edital/…`). 1 call (Bolsas Ramos de Azevedo and Haroldo de Campos 2026, closed in May); the page prints winners' names, which are never stored | allows all | only a privacy page about personal data, 2026-11-16 |
| Sesc Sergipe (measured 2026-11-16) | `https://sesc-se.com.br/chamamento-publico/`: one page per call; the parts keep the artists' calls (convocatória, Aldeia Sesc, Sescanção, gallery) and leave out races, vendors and the service providers' credenciamento. 1 call (Sescanção 2026) | allows all | only a privacy page, no clause on automated access, 2026-11-16 |
| Rio de Janeiro SMC (measured 2026-11-16) | `https://cultura.prefeitura.rio/`: one page per call linked from the home (`/edital-…`, `/pnab-…`, `/circuito-…`, `/pesquisa-e-residencia`); applications on `editaisculturario.com.br` (login, link only). 2 calls (Ações Locais ×2, closed 08/09) | allows (an export-plugin folder disallowed) | none published (the footer links only `lgpd.prefeitura.rio`), 2026-11-16 |
| Cultura Recife — Secult + Fundação de Cultura (measured 2026-11-17) | `https://www.culturarecife.com.br/public/home.php`: one accordion of 196 calls since 2019, each titled by an in-page link (`accordion-toggle`) with its files under it (`./documentos/edital_home_<n>_…/`); the page's open/closed colour is not reliable and no date is printed. Past-year cuts keep 30 calls (68 documents, ~544 credits measured page by page), ~3 of them open | allows (`/cgi-bin/`, `/wusage` disallowed) | none found, 2026-11-16 |
| Spcine — own, PNAB and FSA calls (measured 2026-11-17) | `https://spcine.com.br/editais-spcine/`, `/politica-nacional-aldir-blanc/`, `/editais-fsa/`: one accordion button per call (`x-acc-header`), files under `/wp-content/uploads/`; mostly calls for production companies. 2 calls kept (PNAB 07/2026, FSA 02/2026); the own-calls page lists 57 since 2015, none current | allows (WordPress default) | only a privacy policy PDF, no clause on automated access, 2026-11-16 |
| Fundação Cultural Badesc (measured 2026-11-17) | `https://fundacaoculturalbadesc.com/chamada-publica-2/` (category of posts) plus the fixed `/edital` page from the menu: each call is a post whose own text is the notice (`callPageIsTheNotice`; applications on Google Forms), titled by its `<h1>` or `<title>`. 3 calls: Paulo Gaiad 2027, Fernando Beck 2027 (to 24/01/2027) and the 2021 residency still served at `/edital-residencia` (dated closed by extraction) | allows all | none published (`/termos-de-uso`, `/politica-de-privacidade` 404), 2026-11-16 |
| Sesi SP — editais de cultura (measured 2026-11-17) | `https://www.sesisp.org.br/cultura/editais`: only open calls (closed ones move to `/cultura/editais-encerrados`), each a page under `/cultura/sesi-sp-…` or `/cultura/edital-de-…` linked as `http://` (fetched as `https://`, which the site redirects to); the rules are a PDF on `cronos-media.sesisenaisp.org.br/api/media/1-0/files?file=arq_….pdf`, linked as "Confira o regulamento aqui"/"Acesse o edital". 1 call open (Banco de Talentos Bachiana Jovem); the closed listing reads 11 calls with their notices, so the Nov–Feb wave (~12–15 calls) should read as is | sitemap line only (allows all); media host robots 404 | none on automated access, 2026-11-16 |
| Porto Alegre SMC (measured 2026-11-17) | `https://prefeitura.poa.br/smc/editais`: each call is a news post (`/smc/noticias/…`, "Leia Mais") whose own text is the notice (`callPageIsTheNotice`; Açorianos applications on Google Forms, other notices on Drive or the gazette, not read); 16 posts back to 2023, those published over a year ago skipped by the post's date field (`callPagePublishedAtClass`). 4 calls: Açorianos Música (to 08/12) and Dança (to 29/11) 2026, Usina do Gasômetro and theatres 2026 | allows (Drupal default); the gazette host `dopa.portoalegre.rs.gov.br` answers its app shell as robots, so it is not read | none published (`/termos-de-uso`, `/politica-de-privacidade` 404), 2026-11-16 |
| Paulo Afonso-BA Seculte (measured 2026-11-17) | `https://cultura.pauloafonso.ba.gov.br/editais/`: one `<h3>` per call over its files (`documentsUnderHeadings`), served by a WordPress plugin at the site root (`?smti_edital_download=1&edital_id=…&anexo_id=…&_wpnonce=…`), named only in the link text. The `_wpnonce` changes daily and is required (HTTP 500 without it): a document is known by its URL without it (`documentKeyUrl`). 5 calls: Chamamentos 009 and 010/2026 (Cultura Viva, to 13/12), credenciamento 0007/2026, 06 and 07/2025; 08/2025 links no file | `/wp-admin/` only | none published (404), 2026-11-17 |
| Funesc-PB — editais (measured 2026-11-17; **off**: times out from Convex; through Firecrawl ~68 credits a day; its Plone REST API needs an `Accept` header Firecrawl does not forward) | `https://funesc.pb.gov.br/editais`: Plone, one page per call under `/editais/` (~80 back to 2024, read in ~2 min at 1 s apart), files linked through their `…pdf/view` pages, read as the file (`/view` dropped). Its 2026 calls all post results; on 2026-11-17 it records 9 pages, 1 with a notice to read (2025 theatre monitors, closed, 6 pages); a page inside another call's folder ("Audições … Peças de confronto") is part of that call, not one; a contract ratification page ("TERMO INEX CHAMAMENTO PUBLICO") is procurement, never read | Plone default (allows all) | none found, 2026-11-17 |
| Magé-RJ Seculte (measured 2026-11-18; **off**: no call read) | `https://mage.rj.gov.br/editais/`: one page for every municipal notice (culture, housing, nurseries, vendors), 59 blocks each opened by an image, files labelled "Edital"/"Errata"/"Resultado" with the call number only in some file names. Needs a number from the file name and the image as the boundary. 2026 culture calls 007–014 (PNAB Ciclo 2) all post final results | allows (`/wp-admin/` disallowed) | none on use; a privacy page about visitors' data, 2026-11-18 |
| Balneário Camboriú FCBC (measured 2026-11-18; **off**: frame pages and closed calls without a printed close) | `https://culturabc.com.br/editais-fundacao-cultural/`: Editais 001–011/2026, 7 as posts linking the notice, 4 (003, 008, 010, 011) as hub pages linking only result posts (a hop not taken). With broad URL parts the council's minutes, the theatre and legislation pages come in as calls. Answers 406 to a generic user agent, 200 to the reader's | allows (`/wp-admin/` disallowed) | none published, 2026-11-18 |
| Itajaí FCI "Abertos 2026" (measured 2026-11-18; **off**: groups wrongly) | `https://fundacaocultural.itajai.sc.gov.br/abertos-2026/`: Elementor, each document under its own heading, labels "EDITAL 015 – …" without a year; ~16 calls in 2026. On-listing grouping gives 016 21 documents of other calls; under-headings finds none. Open on 2026-11-18: the theatre booking (016, rolling) and a sponsors' call (Natal Encanto) | allows (`/wp-admin/` disallowed) | none published, 2026-11-18 |
| Rio Branco — Fundação Garibaldi Brasil, Fundo Municipal, PNAB (measured 2026-11-18) | `https://cultura.riobranco.ac.gov.br/admin/editais/edital-listar-json`: the listing page is an Alpine template filled from this JSON (40 calls back to 2020, `id` and `titulo`); each call's page `/site/edital-documento/<id>` is server-rendered with labelled, extensionless files (`/site/edital-documento/download/<n>`) and prints "Data de Término das Inscrições" with its year (`callPagesListedAsJson`). 9 calls in 2026, all with final results: nothing recorded that day | allows all | none published; footer "Todos os direitos reservados", 2026-11-18 |
| Porto Velho — Funcultural, editais (measured 2026-11-18) | `https://funcultural.portovelho.ro.gov.br/arquivos?folder=33997`: a Livewire file manager whose folders open by button (`wire:click="selectFolder(N)"`, no `href`), each also served at `?folder=N`; "Editais" holds one folder per year (2019–2026, named by it), each one folder per call, whose files sit in it or in one folder per document (`callsFiledInYearFolders`). 4 calls in 2026: 3 with results posted, 004/2026 recorded (closed 04/11, no result yet; 3 documents, 58 pages) | allows all (`Disallow:` empty) | none found, 2026-11-18 |
| Palmas — Fundação Cultural (FCP), arquivos (measured 2026-11-18) | `https://www.palmas.to.gov.br/core/orgao/fundacao-cultural/`: one folder per call or subject (`?arquivo_pasta=<uuid>`, real links), each file linked by an eye icon named only by its `aria-label`; courses, the city's plan and its history sit in folders too, with no notice (`callPageNeedsNotice`). One call in 2026, the 10th Salão (05/2026, closed 24/09, 8 pages). Behind Cloudflare: from this machine the first request of each new connection gets a managed challenge (403, `cf-mitigated: challenge`), curl does not | `robots.txt` 404 | `/core/lgpd/`: no clause on automated access, 2026-11-18 |
| Fundação Clóvis Salgado-MG, editais (measured 2026-11-18) | `https://fcs.mg.gov.br/editais/`: one WordPress page, a heading per call (`documentsUnderHeadings`), files linked as "Acesse aqui o Edital", years back to 2017 and the management contract's documents below ("Contrato de Gestão": recorded, never read). 2026: the 6º Prêmio Décio Noviello; Chamamento 01–03/2025 (programming, no result posted) kept as last year's. 4 notices, 34 pages | `Disallow: /wp-admin/` | LGPD page only, no clause on automated access, 2026-11-18 |
| FCMS-MS, consultas de editais (measured 2026-11-18; **off**: broken page, no reader) | `https://www.fundacaodecultura.ms.gov.br/informativos/consultas/`: a table, one row per call, the name in "Assunto" and the file linked as "Acessar proposta" (8 rows; Prêmio Guadakan and 26/2026 Audiovisual "Em andamento"). The menu's `<script>` is never closed, so the table is script text to the reader and to a browser; a row-per-call listing would also need a reader of its own | `Disallow: /wp-admin/` | not read |
| Erechim-RS — Política Nacional Aldir Blanc (measured 2026-11-18) | `https://www.pmerechim.rs.gov.br/pagina/1727/politica-nacional-aldir-blanc`: one page per year, named by it (2020, 2024, 2025, 2026), each linking its calls' pages ("PNAB - Edital nº 04/2026 - Fomento Cultural Geral"); this and last year's are opened (`callPagesOnYearPages`), so the listing outlives the yearly page id. Links are relative to `<base href="https://www.pmerechim.rs.gov.br//">`. Its 3 calls of 2026 closed 09/04 with results posted: nothing recorded that day. The FAACE fund's page stops at 2020 and the LPG ended | `Disallow: /admin` | none published (`/termos-de-uso` 404), 2026-11-18 |
| Araxá-MG Fundação Calmon Barreto, PNAB Ciclo 2 (measured 2026-11-18; **off**: results off the call page) | `https://fundacaocalmonbarreto.mg.gov.br/fomento/categoria/6/lei-aldir-blanc-ciclo-2`: one page per item (`/link/N/…`), calls mixed with notices to all of them (schedule, applicants list, results), files in `/dados/fomento/`, paged. The 3 calls of 2026 (01–03, Premiação, Fomento, TCC Cultura Viva) closed with final results on 10/11, posted as an item of their own, never on the call's page, which prints no close: read today they would cost 139 pages, and the schedule's file reads as a notice. Each cycle is a new category of `/fomento` (Ciclo 1, LPG, Ciclo 2). Turns on with an entry through `/fomento` that follows the newest category, results taken from the listing, and notice items left out | `robots.txt` serves the home page | none published (`/termos-de-uso` serves the home page), 2026-11-18 |
| IPHAN, editais e seleções abertos (measured 2026-11-18) | `https://www.gov.br/iphan/pt-br/acesso-a-informacao/editais-e-selecoes/abertos`: a gov.br Volto page whose listing (24 of 26 items) and each call's file links live only in its embedded `window.__data`, never as `<a>` (`linksOfHtml` reads it); `@querystring-search` answers 404 and `++api++` the same HTML. Files at `…/@@display-file/file` (the object's own URL answers HTML). 17 items: consultant hires (`Projeto 914BRZ…`) and a market survey (RFI) recorded, never read; opinions, agreements and statements with no notice; read once: Adote um projeto 02/2026 (6 pages) and the creator prizes Mário de Andrade and Sílvio Romero 2026 (Editais 7 and 8 of 02/07, 10 and 8 pages, both closed 04/08: no page prints its close; the next come each July) | no rule on `/iphan` (gov.br's disallows cover forms, search and other agencies' paths) | gov.br CC BY-ND 3.0 (team call, pendência 102), 2026-11-18 |
| Museu do Índio (FUNAI), editais (measured 2026-11-18) | `https://www.gov.br/museudoindio/pt-br/acesso-a-informacao/editais`: gov.br Volto as IPHAN, three pages: consultant hires (all to 2023, results posted), use of its spaces (results posted) and the **credenciamento of Indigenous cultural associations** (Edital 90008/2025, open to new entrants for 5 years, 14 pages; its first list of the accredited posted, which no longer drops a credenciamento) | no rule on `/museudoindio` | gov.br CC BY-ND 3.0 (team call, pendência 102), 2026-11-18 |
| UFU — PROEXC, editais de extensão e cultura (measured 2026-11-18) | `https://editais.ufu.br/extensao-cultura`: a Drupal listing of nodes (30 per page, newest first; 180 back to mid-2025 over 6 pages), files in `/sites/editais.ufu.br/files/`. Most nodes are for UFU's students (grants 120, course enrollment 18, internal programs); only "Processo Seletivo de Profissionais" (28) hires anyone: artists and technicians paid once per project (stage direction, cast, sound, lighting: R$ 700–2,000), kept by `callTitleParts`. No page prints its close: the notice's schedule does. 11 on the first page, 9 with results; recorded: PROEXC 17 (to 25/11) and 18 (to 07/12), 9 pages each | `Crawl-delay: 10` (kept: `crawlDelaySeconds`), Drupal defaults | none published; footer "Todos os direitos reservados", 2026-11-18 |
| Sesc Roraima — credenciamento artístico (measured 2026-11-18) | `https://www.sescrr.com.br/cultura/edital-de-credenciamento-de-artistas/`: every file a link titled by its call ("EDITAL Nº 06/2026 – CREDENCIAMENTO ARTÍSTICO – RESULTADO") under year headings (`documentsOnListing` groups them by number); the food vendors' credenciamento (Edital 11/2026, Semana S, April) is left out by `callTitleParts`. The artists' call opens with its publication and closes at the end of February (06/2026: 28/02, 18 pages, results posted): nothing recorded that day | WordPress defaults (`/wp-admin/`, wpforms uploads) | cited, not published (`/termos-de-uso/` 404; privacy policy only), 2026-11-18 |
| Sesc Roraima — editais de artes visuais (measured 2026-11-18) | `https://www.sescrr.com.br/editais-de-artes-visuais/`: same layout; Edital 01/2026 Intervenções de Muralismo (MEI only) closed with its final result in February: nothing recorded that day | as above | as above |
| Fundação José Augusto (RN), editais abertos (measured 2026-11-18) | `https://www.cultura.rn.gov.br/documentos/Editais%20Culturais/Editais%20Abertos/`: a Nextcloud file browser, one folder per call, linked with its name cut ("CHAMADA PÚBLICA Nº 002_2026 ARTISTAS, GR...": the name comes from the folder's URL); a call's files sit one level down ("PUBLICAÇÕES CHAMADA 01_26" with the notice and results, "ANEXOS PARA INSCRIÇÃO…"), served at `/wp-json/nextcloud/v1/download?filePath=…` (`callFilesInSubfolders`). The 2026 Chamadas 001 (artists, groups, collectives) and 002 (popular culture masters) opened in January–February and post Etapa II results; the dance instructors' credenciamento is 01/2024 and the audiovisual call 2023: nothing recorded that day | WordPress defaults (`/wp-admin/`) | none published (`/termos-de-uso/` 404; privacy policy with no clause on content), 2026-11-18 |
| Caruaru oportunidades (measured 2026-11-18; **off**: loose files) | `https://mapacultural.caruaru.pe.gov.br/oportunidades`: a Laravel + Inertia page whose items are JSON in `data-page`, one per file (22), nothing tying a file to its call. None open (Rock Azulado 2026 closed in April; the São João 2027 item seen on 2026-11-15 is gone) | allows all | none published (`/termos-de-uso` 404), 2026-11-18 |
| Secult-ES — editais de chamamento (measured 2026-11-18) | `https://secult.es.gov.br/editaisdechamamento`: one heading per call, its files under it, each linked twice (name, then "Baixar") at `/media/…?v=<upload time in ms>` (`documentsUnderHeadings`). 27 calls back to 2019, none open: 24 drop by year or result; three of 2020 (Fórum da Imagem GHM, Residência na Galeria Homero Massena, Videografias do Meio) name no year and post no result, so they are read once (5 files, 20 pages; team choice over a rule on `?v=`). Its PNAB calls apply through the ES Mapas, registered | 404 | none published (`/termos-de-uso` 404; an LGPD page), 2026-11-18 |
| Secult-ES — editais com página própria (measured 2026-11-18) | Same listing, its menu links followed as call pages (`/GrupodeArquivos/edital-`): Circulação e Intercâmbio (monthly rounds, 2026: 17/03 to 06/11, 35 pages; its URL changes each year, `…-2026-2`, the menu link does not), 2025's, and Parque das Esculturas, all with results: nothing recorded that day | 404 | as above |
| PNAB platform — Bahia, Piauí, Amazonas, Amapá, Tocantins, Macapá (measured 2026-11-17) | One build on six hosts (`bahiapnab.com.br`, `pnabpiaui.com.br`, `pnab.cultura.am.gov.br`, `pnabamapa.com.br`, `pnabtocantins.com.br`, `pnabmacapa.com.br`; vendor not named). Read from the listing of open calls (`/editais?situacao=abertos`), each call a page at a root slug linked as "Acessar", titled by its `<h1>`; every file is linked as "Baixar" at `/lerarquivo/<base64 path>/<base64 title>`, and the title it carries is the label (annexes and results are known by it). 0 open on all six (~44 calls in 2026, all with results by the full listing); the next wave is PNAB Ciclo 3. Menu pages with files ("Material de apoio", "Transparência") are recorded with no notice, never read. All six answer Convex | `Allow: /`, `Disallow: /vendor` on all | none published (terms URLs redirect home), 2026-11-17 |
| Concultura Manaus PNAB Ciclo 2 (measured 2026-11-16) | `https://concultura.manaus.am.gov.br/pnab-ciclo-2`: one page per call (`/edital-0…`; Edital 001 is a `?page_id=…&preview=true` link and is missed). Editais 002–013/2026 all post results: nothing recorded that day | allows all | none published, 2026-11-16 |
| Ponta Grossa SMC PNAB (measured 2026-11-15) | `https://cultura.pontagrossa.pr.gov.br/lei-aldir-blanc/`: one heading per call, every document linked as "clique aqui"; it times out from Convex (US East) and answers from Brazil, as Pernambuco: read through Firecrawl from Brazil since 2026-11-16 | allows (WordPress default, plus `/wp-content/uploads/wpforms/` disallowed) | none published, 2026-11-15 |
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
| Aracaju (Funcaju Mapas, `mapacultural.aracaju.se.gov.br`) | `robots.txt` answers HTTP 500 (the Mapas app's own `TemplateNotFound`, 2026-11-15 and 2026-11-17): read as disallow. A future partner (team, 2026-11-17); its only open item, the yearly credenciamento 003/2026, runs to 2028 |
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