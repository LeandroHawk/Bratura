# Firecrawl

What Firecrawl does in Bratura: **reads the official pages that have no API and the text of every
call's PDF**, including the PDFs linked from the Mapas API (eligibility, amounts and documents live
only there). Which sites: `docs/data-sources.md`. Based on the team's analysis of the Firecrawl docs
(`docs.firecrawl.dev`: scrape, crawl, change tracking, `maxAge`, webhooks, billing).

## Ingestion flow (`packages/backend/convex/ingestion/`)

```
crons.ts (daily)
  └─ ingestion reads the `sources` table
       ├─ Mapas Culturais → public JSON API (no Firecrawl, no credits)
       │     └─ PDF links of each call ─────────────────────────────┐
       └─ sites without an API (SP city, Amigos da Arte, Goiás)      │
             └─ /map (lists the site's URLs) → keep call-like URLs ──┤
                                                                     ▼
                           /scrape or /batch/scrape → Markdown (PDFs included)
                                                                     ▼
                      changed? (changeTracking or a hash of the Markdown) ── no → stop
                                                                     ▼ yes
                      llm/ (Gemini): JSON with a verbatim quote per field
                                                                     ▼
                      Zod safeParse + evidence check → `callNotices`
                                                                     ▼
                      matching (rules) → `matches`
```

The team's draft of this flow also stored an embedding per call; matching is rules only
(`docs/plan.md`, What to build), so embeddings wait for a consumer (`docs/architecture.md` §6).

## Uses

1. **PDF → Markdown.** `/scrape` detects a PDF by its URL and returns clean Markdown. The main use.
2. **Finding calls on sites without an API.** `/map` lists a site's URLs; filter by patterns
   (`/edital`, `/chamamento`, `.pdf`) and `/batch/scrape` only the new ones. `/map` costs 1 credit
   per call. For one section,
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
  extra credits per page and would take extraction out of `llm/`, where the evidence check and the
  swappable provider live (`docs/security.md` §3).
- **Credits are the budget.** The team gets 5,000 credits per member once the competition draft is
  approved; before that, only the free plan (1,000 credits a month). Per the team's reading of the
  billing page (recheck before relying on it): a scrape costs 1 credit per page and a PDF adds about
  1 per PDF page, so a 30-page call costs around 31: about 30 calls a month on the free plan, about
  160 per member's 5,000. JSON mode would add 4 credits per page. Hence: Mapas through its API first, Firecrawl only where there is no
  API, `maxAge` caching (default 2 days) and change tracking so nothing is read twice. The free
plan has no pay-as-you-go: when credits run out, calls fail with HTTP 402, so ingestion logs it in
`ingestionRuns` and stops.
- **robots.txt is respected** (Firecrawl's default; never turn it off). Blocked URLs show up as
  `robotsBlocked` in the crawl errors: record them in `ingestionRuns`.
- **The response is parsed at the edge** by a Zod schema inside `ingestion/`; it is not a DTO and
  not in `shared` (`docs/contracts.md` §2).
- **`FIRECRAWL_API_KEY` lives only in Convex environment variables.** The official SDK
  (`@mendable/firecrawl-js`, in a `"use node"` action) is a new dependency: the team decides, or
  plain `fetch`.
- **Never per user request**: batch ingestion only (`docs/security.md` §2).

## Open for brainstorming

- `/search` could suggest new call sites to the team, never add them: worth it?
- How often to re-read a page: daily for all, or by how close the deadlines are?
