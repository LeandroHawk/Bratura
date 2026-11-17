# Firecrawl

What Firecrawl does in Bratura: **reads the text of every call's PDF**, including the PDFs linked from the Mapas API (eligibility, amounts and documents live
only there). Which sites: `docs/data-sources.md`. Based on the team's analysis of the Firecrawl docs
(`docs.firecrawl.dev`: scrape, crawl, change tracking, `maxAge`, webhooks, billing).

## Ingestion flow (`packages/backend/convex/`: `ingestion.ts`, `documents.ts`, `model/firecrawl/`)

```
crons.ts (daily)
  └─ ingestion reads the `sources` table
       ├─ Mapas Culturais → public JSON API (no Firecrawl, no credits)
       │     └─ document links of each call (`documentUrls`) ──────┐
       └─ official pages (BA FUNCEB, Rio, MG…: no API)               │
             └─ plain fetch of the listing (no credits) → call pages ┤
                                                                     ▼
          by hand for now (documents.ts) → /scrape → Markdown (PDFs included)
                                                                     ▼
                      changed? (changeTracking or a hash of the Markdown) ── no → stop
                                                                     ▼ yes
                      model/llm/ (Gemini): JSON with a verbatim quote per field
                                                                     ▼
                      Zod safeParse + evidence check → `callNotices`
                                                                     ▼
                      matching (rules) → `matches`
```

A source that answers only from Brazil (`answersOnlyFromBrazil`) takes neither free route: its
Mapas API or listing and call pages go through Firecrawl from Brazil, 1 credit a page (Decisions).

The team's draft of this flow also stored an embedding per call; matching is rules only
(`docs/plan.md`, What to build), so embeddings wait for a consumer (`docs/architecture.md` §6).

## Uses

1. **PDF → Markdown.** `/scrape` detects a PDF by its URL and returns clean Markdown. The main use.
2. **Not for finding calls on official pages.** Their listings are server-rendered HTML (5 of 5
   measured on 2026-11-15: PR, BA, Rio, MG, MA), so a plain fetch finds the call pages and document
   links for free (`officialPage` source: `discovery`, `documentUrlParts`). `/map` (1 credit per
   call) stays the option for a site that renders its list with JavaScript. For one section,
   `/crawl` with `includePaths` and `limit`.
3. **New calls and amendments.** `changeTracking` (`git-diff` mode) says what changed since the last
   scrape: an unchanged page spends no Gemini call; an amended deadline triggers a new extraction and
   an alert ("o prazo mudou").
4. **Provenance.** Store with each call notice the `sourceUrl`, `scrapedAt`, the Markdown hash and
   the verbatim quote per extracted field.
5. **Long batches without hitting Convex action limits.** Async `/batch/scrape` or `/crawl` with a
   **webhook** (`page`, `completed`) into a Convex HTTP action in `http.ts`. This postpones the
   `apps/crawler` worker of `docs/architecture.md` §1.
6. **"What is missing" guidance.** The official gov.br pages on getting CCMEI and SICAB can be read
   and shown step by step with the link and the date read, after checking their robots.txt and terms.

## Decisions

- **Firecrawl's Markdown + our own Gemini extraction**, not Firecrawl's JSON mode: JSON mode costs
  extra credits per page and would take extraction out of `model/llm/`, where the evidence check and the
  swappable provider live (`docs/security.md` §3).
- **Credits are the budget.** The team gets 5,000 credits per member once the competition draft is
  approved; before that, only the free plan (1,000 credits a month). **Measured 2026-11-14** (50
  real call documents, `creditsUsed` in each answer): **a PDF costs 1 credit per page** (26 pages,
  26 credits), a main call notice runs 3–41 pages (about 19 on average); `.doc`, `.docx` and `.odt`
  read too. **The rate limit is about 10 scrapes a minute**: past it Firecrawl answers 429, which
  costs nothing and says when to retry. JSON mode would add 4 credits per page. Hence: Mapas through its API first, Firecrawl only where there is no
  API, `maxAge` caching (default 2 days) and change tracking so nothing is read twice. The free
plan has no pay-as-you-go: when credits run out, calls fail with HTTP 402, and the run stops (a
document read stores it as the `outOfCredits` failure of the document it was reading).
- **Which of a call's documents are read, by name** (the link's text on an official page, else the
  file name; a call lists up to 37, and reading them all costs about ten times more): the call
  notice itself (or its consolidated text), its amendments
  (errata, aditivo, adendo, prorrogação, reabertura: they move deadlines), and the annexes with
  categories and amounts per project (only there in 3 of 5 calls) or evaluation criteria (how a
  portfolio is scored: only there). **Never** results, rankings or lists of applicants (personal
  data, ruled out by either name), nor the forms an applicant fills in. A call whose notice no name
  identifies is left for the admin review. Rules: `model/callNoticeDocuments/selection.ts`.
- **Every measured number here is Mapas Culturais, mostly Ceará** (2026-11-14): file names,
  Markdown from its PDFs, the `2111` sentinel, extraction accuracy. A new source (another Mapas
  instance, a city's own site, a scanned PDF) is measured on a sample before it is trusted; its
  `valuesRefused` in the extractions is the first sign it needs its own rules.
- **Reading is run by hand for now** (`convex run`, with a credit ceiling per run), not by the
  daily cron, so no read spends credits nobody planned. **One exception: sources that answer only
  from Brazil** (`answersOnlyFromBrazil` in `model/sources/registry.ts`). Some government sites time
  out from Convex (US East) and answer from Brazil; measured 2026-11-16, `/v2/scrape` with
  `formats: ['rawHtml']` and `location: { country: 'BR' }` returned Pernambuco's and Sergipe's Mapas
  API JSON intact in 2–3 s and Ponta Grossa's listing in 6 s, while without the location Firecrawl
  failed like Convex. For those sources the daily ingestion fetches the listing (and each call page)
  through Firecrawl, 1 credit per page per day: 4 sources on 2026-11-17, about 4 credits a day.
  Those reads ask `maxAge: 0` (the default cache would answer a listing up to two days old), keep
  the caller's timeout (30 s a page, 60 s for Mapas; Firecrawl's own `timeout` is 10 s shorter so
  its error arrives first), are spaced 6.5 s apart and retried once after a 429, as document reads
  are (`model/firecrawl/client.ts`). Their documents are read with the same location; the
  local PDF rescue is skipped for them.
- **robots.txt is respected** (Firecrawl's default; never turn it off). Blocked URLs show up as
  `robotsBlocked` in the crawl errors: record them in `ingestionRuns`.
- **The response is parsed at the edge** by a Zod schema in `model/firecrawl/payload.ts`; it is not a DTO and
  not in `shared` (`docs/contracts.md` §2).
- **`FIRECRAWL_API_KEY` lives only in Convex environment variables.** The official SDK
  (`@mendable/firecrawl-js`, in a `"use node"` action) is a new dependency: the team decides, or
  plain `fetch`.
- **Never per user request**: batch ingestion only (`docs/security.md` §2).

## Open for brainstorming

- `/search` could suggest new call sites to the team, never add them: worth it?
- How often to re-read a page: daily for all, or by how close the deadlines are?
