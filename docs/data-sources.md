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

| Instance | Host | Open on 2026-11-07 |
| --- | --- | --- |
| Federal | `mapa.cultura.gov.br` | 64 |
| Ceará | `mapacultural.secult.ce.gov.br` | 30 |
| Pernambuco | `mapacultural.pe.gov.br` | 15 |
| Santo André-SP | `culturaz.santoandre.sp.gov.br` | 1 |
| Canindé-CE | `mapacultural.caninde.ce.gov.br` | 0 (monitor) |

```
GET https://{host}/api/opportunity/find
  ?@select=id,name,shortDescription,registrationFrom,registrationTo,owner.name,singleUrl
  &@files=(downloads):url
  &registrationFrom=LTE({today})
  &registrationTo=GTE({today})
  &@order=registrationTo ASC
```

- Always an explicit `@select`: `@select=*` returned non-JSON. `{today}` is `YYYY-MM-DD`.
- Dates come as `{ "date": "2026-11-08 23:59:00.000000", "timezone": "America/Fortaleza", … }`:
  parse with that timezone.
- The PDF URL is in `"@files:downloads": [{ "url": … }]`.
- Filters: `EQ`, `LIKE` (with `*`), `BET(a,b)`, `GTE`, `LTE`, `AND(...)`, `OR(...)`, `!`.
- **Dirty data**: payment forms ("habilitação de pagamento"), council elections, Mapas
  opportunities created by individuals. Classification drops them from creator-facing lists.
- SP capital (`spcultura.prefeitura.sp.gov.br`) did not answer in 90 s: keep as inactive, retry.

## Official pages (Firecrawl)

| Source | URL | robots |
| --- | --- | --- |
| São Paulo city culture calls | `https://prefeitura.sp.gov.br/web/cultura/editais/` | allows all |
| Amigos da Arte (SP state calls) | `https://amigosdaarte.org.br` (current list not found; `/editais/` redirects to `/editais-antigos/`) | allows except wp-admin |
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
| Other Mapas instances | No official list. Guessed hosts for BA, GO, ES, SP, RS, MS do not resolve; `mapacultural.es.gov.br` returns no API JSON |
| Espírito Santo fair sites | `aderes.es.gov.br`, `www.es.gov.br`, `secult.es.gov.br` return 404 for robots.txt: check each site before use |
| SMC Editais, Promac (`smceditais…`, `smcpromac…`) | Application systems (API 401): link to them, not sources |
| ProAC (SP state, ~R$ 90 mi in 2026) | Applications closed 3/8; current official page not found |
| São José dos Campos | Uses Prosas: out |
| News (e.g. Catraca Livre) | robots allows except search and `wp-json`; a signal only, never stored |
| DOU via dados.gov.br | The API needs a token (401); the Imprensa Nacional open-data page did not answer. A key or an INLABS sign-up would be easy, but DOU only adds federal calls already in the federal Mapas instance |
| Querido Diário | API down (HTTP 522 since 2026-10-19, open issue in `okfn-brasil/querido-diario-api`); its robots says `Content-Signal: search=yes,ai-train=no,use=reference`; the API moved to `api.queridodiario.org.br`. Recheck later |
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

New sources are welcome as proposals, with the robots.txt and terms check. Open now: other Mapas
instances (no official list found), where ProAC and Amigos da Arte list current calls, the Goiás
fairs page, and whether the demo shows recently closed SP calls marked as closed (most 2026 SP
windows closed June–September) while matching only lists open ones.
