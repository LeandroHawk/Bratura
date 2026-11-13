# Plan to 30/11

The brief for whoever joins the build, human or Devin: the product in short, the competition rules,
what each tool does and the plan to the deadline. **Temporary**: it ends with the hackathon. What
lasts lives in its own file: rules in the `AGENTS.md` files, the system in `docs/architecture.md`,
contracts in `docs/contracts.md`, security in `docs/security.md`, sources in `docs/data-sources.md`,
integrations in `docs/integrations/`. Read those before writing code; when something here is marked
TBD, ask instead of guessing.

## The product

A copilot for individual Brazilian creators (artisans, musicians, visual and performing artists,
cultural MEI) who cannot afford a producer. The creator builds a **portfolio once**; it is also the
**profile** matched against open **calls (editais), festivals and fairs**. For each match Bratura
explains the call in plain Portuguese, shows **what is missing** (MEI, SICAB, CCMEI, years of proven
activity, documents), prepares an **application kit** (portfolio in the call's format, suggested
texts, document checklist) and sends **deadline alerts** by e-mail and WhatsApp.

**Who pays:** the creator never pays (no paywall on the creator side). Revenue is the multi-profile
panel for associations, cooperatives and producers, then culture departments; sponsors in phase 2.
Never a share of the prize, never selling data.

## Competition rules (Hack Brasil 2026, track Cultura & economia criativa)

- Online phase until **30/11/2026 23:59**. Repo created after 04/11/2026 21:00, no earlier code or
  history (rules 6.1, 6.2); open-source libraries under their licences (6.5).
- Repo **public until at least 15/12/2026** (6.7), MIT licence (6.6).
- Demo online during judging (7.3) with **no real personal data of third parties** (6.9): a
  fictional creator, Dona Maria.
- UI copy in pt-BR and English in the same change; code and docs in English.
- **How it is judged** (regulamento, read 2026-11-06): track fit is **eliminatory** (5.4/5.5), "citar
  o tema ou ter uma funcionalidade secundária ligada a ele não basta", so the core stays tools for
  creators, never marketing. Four criteria, equal weight: execução técnica (works, complete; also
  the tiebreak), implementação técnica (architecture, code, tech choices; sponsor tools count here
  like any tool, 6.3), impacto ("o efeito sobre o problema e o público da trilha"), comunicação
  (the video and the final pitch). Each judge scores 0–10 per criterion (max 40); the project gets
  the judges' average. Up to 5 finalists per track; the top 3 overall win; honorable mentions are
  possible (9.7). Finalists announced 2/12, confirmed by 4/12; final on 12/12 in São Paulo with
  Google for Startups, in person, travel not covered.
- **Deliverables by 30/11 23:59**, in the team panel: the public repo, an HTTPS demo, the video
  (≤ 3 min, Portuguese or English), name, summary and description. Team composition freezes then.
- **Public starter kits and libraries are allowed** if the commit message names where the code
  came from (6.2); finance demos may run in test or simulation environments (6.9).
- **Help**: mentors on Discord (`#pedir-mentoria`, `/mentoria`), listed at hackbrasil.com/mentores.
  Sponsor livestreams are optional and do not count for the score.
- **Sponsors we use**: Firecrawl, Convex, Resend, WorkOS, Cognition (Devin), Nvoip; AbacatePay is
  under study (`docs/product.md`). Their tools weigh the same as any tool; the prizes they give
  are listed on hackbrasil.com.

## Tools and what each one does

| Tool | What it does in Bratura | When |
| --- | --- | --- |
| Devin | Pair programming in small PRs that follow the `AGENTS.md` files; never in production | After the competition draft is approved (the coupon comes with it) |
| Convex | Database, functions, ingestion cron, portfolio files, `http.ts` for webhooks | First, after the Zod bridge check (`docs/architecture.md` §7) |
| Firecrawl | Reads pages without an API and the text of every call PDF | Batch ingestion only; credits come with the draft (`docs/integrations/firecrawl.md`) |
| Gemini (free tier) | Classifies and extracts call fields, plain summaries, kit texts | Behind `llm/` in the backend |
| WorkOS | Login (Google, e-mail code) | Can come last: the demo uses a fictional creator |
| Resend | Deadline e-mails | With alerts |
| Nvoip | WhatsApp templates (and inbound, if available) | A plus, owned by the WhatsApp team (`docs/integrations/whatsapp.md`) |

## What to build

1. **Ingestion**: Mapas API + Firecrawl → classification and extraction (every field nullable, each
   with a verbatim quote, checked against the text) → `opportunities`.
2. **Portfolio**: uploads, links, text → dated items the creator confirms; MEI/SICAB/CCMEI asked,
   never inferred.
3. **Matching and gaps**: deterministic rules (region, applicant type, art form, deadline) → status
   `eligible` / `almost` / `not` with reasons, stored in `matches`.
4. **Application kit**: texts from the creator's portfolio and the extracted requirements only, a
   checklist, the portfolio in the call's format.
5. **Alerts**: e-mail at D-7 and D-1; WhatsApp templates.

Starting tables: `sources`, `opportunities`, `ingestionRuns`, `creators`, `portfolioItems`,
`matches`, `applicationKits`, `alerts`, `organizations`, `memberships`. Screens: onboarding,
portfolio builder, opportunities (Elegível / Quase / Todos), opportunity detail, kit, org panel,
admin review. The landing still lacks the way into the app ("Começar meu portfólio", "Sou uma
organização"), which comes with login.

## Dates

## Who does what

| Who | Role | Focus |
| --- | --- | --- |
| Atilio Almeida | Product owner | Product insights, research inputs, business model and monetization (`docs/product.md`) |
| João Victor | Tech lead | Repository foundation (front-end patterns, the contract, the tools) and **Firecrawl ingestion** |
| Leandro | Integrations developer | WhatsApp front end; helps with Firecrawl ingestion |
| Kaik | Integrations developer | WhatsApp front end |

**Firecrawl ingestion comes first.** Without calls read from the official sources there is nothing
to match, explain or alert about: the backend, the screens and WhatsApp all consume it. Nothing of
it exists yet (2026-11-13).

## Dates

The first row of the original plan (08–10/11: app + Convex + login) is overdue: as of 2026-11-13
there is no backend. **Proposal, to confirm with the team:**

| Dates | Deliverable | Who |
| --- | --- | --- |
| 13–15/11 | `packages/backend` with Convex, Zod bridge check, `sources` / `opportunities` / `ingestionRuns`; Mapas ingestion; first PDFs through Firecrawl (free plan until the draft's credits) | João Victor, Leandro |
| 16–18/11 | Extraction with evidence check for ~10 chosen calls, admin review, opportunity list and detail with source links | João Victor, Leandro |
| 13–18/11 | Nvoip answers (`docs/integrations/whatsapp.md`), templates submitted for approval, opt-in fields | Leandro, Kaik |
| 13–18/11 | Who the demo creator is, which calls to show, pitch numbers from the data | Atilio |
| 19–22/11 | Fictional creator, simple portfolio, matching and gaps | João Victor |
| 19–25/11 | WhatsApp alerts from the cron; inbound "meus editais" if Nvoip allows | Leandro, Kaik |
| 23–25/11 | Kit (texts + checklist), e-mail alerts, login | João Victor |
| 26–27/11 | Plus: org panel, portfolio PDF, Firecrawl page sources beyond the PDFs | all |
| 28–29/11 | Freeze, demo data, video (Portuguese, subtitled) | all |
| 30/11 | Submit | Atilio |

## The demo's minimum

Agreed 2026-11-08: the final demo must work with real data (rules 7.2, 9.1), so no mocks. One happy
path with the fictional Dona Maria: (1) her portfolio already loaded, as a dated timeline with
evidence; (2) real calls from the Mapas API, public bodies only, open or closed with the deadline;
(3) one call opened: requirements in plain language crossed with the portfolio ("3 years required,
2 with evidence", "missing CCMEI"); (4) the application kit. **Calls are pre-processed by the
ingestion job and stored: Gemini is never called live during the demo.** Everything beyond this
path (WhatsApp, real e-mail sends, the org panel) is a plus; Firecrawl moved from plus to first
priority on 2026-11-13, since the PDFs are where the requirements are.

## Done means

- The demo runs end to end on the deployed URL with the fictional creator.
- Every requirement shown has a source link; nothing invented.
- `pnpm check` passes.
- README setup in under 5 commands; `MANIFEST.md` filled in.

## How to work

Small PRs, one concern each, into `dev` (`AGENTS.md`, Git). Ask before adding a dependency or a data
source. Review with `docs/review.md` before opening a PR. Prefer the simplest thing that works: this
is a three-week build.

## Open for brainstorming

The plan is the team's: dates, cuts and owners are open to change at any time. Raise it early when a
row will not fit.
