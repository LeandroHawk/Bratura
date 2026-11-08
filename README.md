# Bratura — grant copilot for creators

> **Monte seu portfólio uma vez. A gente encontra as oportunidades, diz o que falta e prepara sua inscrição.**

**Em português:** um copiloto para artesãos, músicos, artistas e MEIs da cultura. O criador monta o
portfólio uma vez; o sistema encontra editais, festivais e feiras compatíveis, explica cada um em
linguagem simples, aponta o que falta (MEI, SICAB, comprovação de atuação) e gera a inscrição no formato
de cada chamada, com alerta de prazo por e-mail e WhatsApp.

Hack Brasil 2026 · Track **Cultura & economia criativa** · [Repository](https://github.com/LeandroHawk/Bratura) · [Demo](https://…) · [Video](https://…) ·
[Manifesto](MANIFEST.md)

---

## The problem

Brazil distributes billions of reais to culture every year through public calls (editais). Most of it
never reaches small creators: calls are scattered across dozens of websites, written in legal language
inside PDFs, and ask for things creators lack — a portfolio, dated proof of years of activity, an
artisan registration (SICAB), a micro-entrepreneur certificate (CCMEI). People who can afford a producer
apply. Everyone else misses deadlines or gets disqualified for a missing document.

## What it does

1. **Portfolio with evidence.** Upload photos, links, documents, or tell your story by text or voice.
   AI turns it into a dated timeline of activities, each one backed by evidence.
2. **Matching.** That portfolio is your profile. We match it against open calls, festivals and fairs:
   *eligible*, *almost eligible (missing X)*, or *not eligible (why)*.
3. **Plain-language explanation.** Value, who can apply, deadline and documents, each with a link to
   the official source.
4. **Gaps, with the fix.** "This fair requires SICAB — here is how to get it."
5. **Application kit.** The portfolio in the format the call asks for, suggested texts drawn only from
   your own portfolio, and a document checklist.
6. **Alerts.** E-mail and WhatsApp before each deadline; ask "o que falta?" right in the chat.

**Trust rule:** every value, deadline or requirement comes from the official source, with a link. The
AI summarizes and suggests; it never invents facts about a call. If a field is not in the source, the
app says "não informado".

## Data sources

Only open sources that allow automated access (robots.txt and terms checked):

| Source | Access |
|---|---|
| Mapas Culturais — federal, Ceará, Pernambuco, Santo André, Canindé | Public JSON API |
| Edital PDFs linked by those APIs | Firecrawl |
| São Paulo city culture editais page | Firecrawl |
| Amigos da Arte (São Paulo state calls) | Firecrawl |
| Goiás government (craft fairs) | Firecrawl |
| The creator's own uploads | Convex storage, with consent |

Excluded on purpose: platforms whose terms forbid scraping (e.g. Prosas, social networks), sources
that block crawlers, and anything exposing personal data. The demo uses a **fictional** creator.

## Architecture

```
 Web (Next.js) ──┐                      ┌── Mapas Culturais APIs
 WhatsApp ───────┼──►  Convex backend ◄─┼── Official pages + PDFs (Firecrawl)
 E-mail (Resend) ┘   ingestion · portfolio · matching · alerts
                     DB · cron · vector search · file storage
 Login: WorkOS        LLM: Gemini API (free tier, behind a swappable adapter)
```

- **Ingestion** (scheduled): fetch opportunities → read the PDF → LLM classifies (is it a real
  opportunity?) and extracts requirements as zod-validated JSON with source quotes → store with the
  source link and an embedding → recompute matches → schedule alerts.
- **Matching** is rule-based (region, applicant type, art form, deadline, MEI/SICAB/CCMEI); the LLM is
  used for reading PDFs, organizing portfolios and drafting texts.
- **WhatsApp** is not a separate service: its webhook is a Convex HTTP action sharing the same logic as
  the web app.

## Stack

| Layer | Tech |
|---|---|
| Web | Next.js (App Router), TypeScript, Vercel |
| Backend / DB | Convex (queries, mutations, actions, cron, vector index, file storage, HTTP actions) |
| Auth | WorkOS AuthKit |
| E-mail | Resend |
| Messaging | WhatsApp Cloud API |
| Crawling | Firecrawl |
| AI | Gemini API (free tier) |
| Validation | zod: one schema per concept, shared by web and backend |

## Repository structure

pnpm workspaces + Turborepo. The web app and the backend share one design system and one set of
schemas.

```
apps/web/            Next.js app: src/app (routing) and src/features (one folder per screen)
packages/ui/         @bratura/ui design system; its living reference is the /design route
packages/shared/     the contract: Zod entities and primitives used by web and backend
packages/backend/    (next) Convex: schema, ingestion, portfolio, matching, alerts, WhatsApp
docs/architecture.md how it fits together and why
```

Each of these folders has an `AGENTS.md` with its rules and examples, for contributors and coding
agents alike; the root `AGENTS.md` lists them.

## Getting started

Requirements: Node 22, pnpm, a Convex account, and API keys for WorkOS, Firecrawl, Resend, Gemini
(and WhatsApp Cloud API for the chat flow).

```bash
pnpm install
cp .env.example .env.local          # fill in your keys — never commit them
pnpm exec convex dev                # Convex dev deployment (keep it running)
pnpm dev                            # Next.js on http://localhost:3000
```

Useful scripts:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm check          # lint + typecheck + test + build, what CI runs
```

## Environment variables

| Variable | Used by |
|---|---|
| `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL` | web, backend |
| `WORKOS_CLIENT_ID`, `WORKOS_API_KEY`, `WORKOS_REDIRECT_URI` | auth |
| `FIRECRAWL_API_KEY` | ingestion |
| `GEMINI_API_KEY` | ingestion, portfolio, kit |
| `RESEND_API_KEY` | alerts |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN` | WhatsApp |

## Future plans (if time allows)

- **Libras (Brazilian Sign Language) with [VLibras](https://www.gov.br/governodigital/pt-br/vlibras):**
  the federal government's free, open-source widget, where a 3D avatar signs the text the reader
  selects or clicks. Integration is one script and one element. Load it only on pt-BR pages (it
  translates from Portuguese) and only when the reader asks for it, since it downloads a lot from
  `vlibras.gov.br`. Hand Talk is the paid alternative.
- **"Ouvir" (listen) button**, for readers who see the page but struggle to read it (low literacy,
  dyslexia, fatigue), who do not use a screen reader. Uses the browser's Web Speech API
  (`speechSynthesis`): native, free, no dependency; the voice is the reader's system voice in the
  page's language. One button per block that matters (a call's plain summary, what is missing),
  toggling listen/stop and announcing its state. **Start on the landing page** (hero and "how it
  works"), where judges see it first, then the app screens.

## Business model

Creators use it for free (search, alerts, basic portfolio). Revenue comes from those with a budget:
a per-call application kit for creators who want it, a multi-profile panel for artisan associations,
cooperatives, producers and project consultants (main revenue), and contracts with city culture
departments that want more complete applications. Phase 2: connect approved projects with sponsors
through the Rouanet tax-incentive law.

## Team

| | Role |
|---|---|
| **Atilio Almeida** | Idea and product lead |
| **Leandro** | [role] |
| **Kaik** | [role] |
| **João Victor** | [role] |

## License

[MIT](LICENSE)
