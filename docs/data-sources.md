# Data sources

Where call notices (editais) come from, what we may collect, and what we never touch. How Firecrawl reads the
pages and PDFs: `docs/integrations/firecrawl.md`. Sources verified on **2026-11-07**; recheck a
source's robots.txt and terms before adding or changing it.

## Rules

- **Only sources that allow it**: robots.txt and terms read and recorded before a source enters the
  `sources` table. A source never enters automatically. The competition excludes "coleta de dados
  que viole os termos do site de origem ou exponha dados pessoais" (5.2) and scraping that exposes
  personal data (6.8).
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
(Pará, Santa Luzia-MG, Petrolina-PE, Lagoa Santa-MG, Cianorte-PR, Anápolis-GO) are not added yet;
Lagoa Santa sends Cloudflare content signals, a team call as for Mongaguá.

```
GET https://{host}/api/opportunity/find
  ?@select=id,name,shortDescription,registrationFrom,registrationTo,singleUrl
  &@files=(downloads):url
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
- `"@files:downloads": [{ "url": … }]` is every attachment, absent when there is none (41 of 59
  federal calls): the call notice and its annexes (up to 37 on one call), plus `.docx` forms and
  media (`.mp4`, `.mp3`, `.jpg`). A call notice stores the text files in order (`documentUrls`),
  media left out; which one is the call notice is decided when documents are read.
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

| Source | URL | robots |
| --- | --- | --- |
| Bahia FUNCEB (measured 2026-11-15) | `https://www.ba.gov.br/fundacaocultural/editais-2026`: one page per call | allows (only `serverinfo.json` disallowed) |
| Rio de Janeiro city SMC (measured 2026-11-15) | `https://cultura.prefeitura.rio/`: one page per call, the notice named "REGULAMENTO" | allows except wp-admin |
| Minas Gerais Secult (measured 2026-11-15) | `https://www.secult.mg.gov.br/editais/editais-pnab/editais-pnab` and `/editais/fundo-estadual-de-cultura-fec/editais-fec`: the listing links the documents (`?download=`) | 404: nothing declared |
| Maranhão Secma (measured 2026-11-15) | `https://cultura.ma.gov.br/programas-ou-campanhas/editais-secma`: the listing links the PDFs | allows (Semrush, Petal disallowed) |
| São Paulo city culture calls | `https://prefeitura.sp.gov.br/web/cultura/editais/` | allows all |
| Amigos da Arte (SP state calls) | `https://amigosdaarte.org.br/editais_/` (with the underscore; RSS at `/editais_/feed/`); the 4 calls of 2026 are closed | allows except wp-admin |
| Santos (SECULT: PNAB 2026, FACULT) | official pages with the PDFs; all 2026 calls closed (2026-11-14) | 404: nothing declared |
| Goiás government (craft fairs) | `https://goias.gov.br` (the fairs page is still to find) | allows except wp-admin |

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