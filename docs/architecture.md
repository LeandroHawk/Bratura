# Architecture

How Bratura is laid out and why, across folders. The rules of each folder live **in that folder**,
in its `AGENTS.md`; this file is the map, the decisions that cross folders, and the backend until it
has a folder of its own. `AGENTS.md` at the root lists the rules in one line each.

Cross-cutting subjects have their own file: `docs/contracts.md` (shapes, ports, what the front
sends), `docs/security.md` (ownership, abuse, prompt injection), `docs/data-sources.md`,
`docs/integrations/` (Firecrawl, WhatsApp), `docs/product.md` and, until 30/11, `docs/plan.md`.

Status: **2026-11-13.** The web app and the design system follow it. `packages/shared` holds the
locale and the first entities (`sources`, `callNotices`, `ingestionRuns`); `packages/backend` holds
their Convex tables and nothing else yet.

## 1. Workspaces and the three levels of "shared"

pnpm workspaces + Turborepo. Packages are consumed as TypeScript source, with no build step.

| workspace          | what it is                                               | rules in                         |
| ------------------ | -------------------------------------------------------- | -------------------------------- |
| `apps/web`         | Next.js App Router: landing, creator app, org panel, admin | `src/app/AGENTS.md`, `src/features/AGENTS.md` |
| `packages/ui`      | `@bratura/ui`, the design system                         | `packages/ui/AGENTS.md`          |
| `packages/shared`  | the contract: Zod entities and primitives                | `packages/shared/AGENTS.md`, `src/primitives/AGENTS.md` |
| `packages/backend` | Convex (not created yet)                                 | §3 below, until it exists        |

**"Shared" has three levels, decided by who uses the piece today**, never by who might:

| level            | used by                          | lives in                                        |
| ---------------- | -------------------------------- | ----------------------------------------------- |
| end to end       | the web **and** the backend      | `packages/shared`                               |
| one environment  | several fronts, or several backs | a package per environment, born with the second app |
| one app          | several features of one app      | `apps/<app>/src/features/common/`               |

Inside a feature the idea repeats: `common/` is common **at the level of its folder**.

- **A piece starts where its only consumer is** and moves up when a second consumer appears. The
  second consumer decides *where* it lives, not *whether* it exists.
- **The backend never trusts the web**, so validation that crosses the wire runs from one
  declaration on both sides: the contract is a package, not a copy.

### How it grows: `apps/` or `packages/`

**What decides the folder is who imports it, not whether it is deployed.** `apps/` holds what is
deployed and imported by nobody; `packages/` holds what something imports. The Convex backend is
deployed on its own (`convex deploy`) and still lives in `packages/backend`, because the fronts
import its generated API (`import { api } from '@bratura/backend/convex/_generated/api'`), and an
app never imports another app. Convex's own monorepo template
(`get-convex/turbo-expo-nextjs-clerk-convex-monorepo`, checked 2026-11-08) does the same:
`apps/web`, `apps/native`, `packages/backend`.

A hypothetical full picture, each piece born only when it has a consumer:

```
apps/
  web/          Next.js       → Vercel (project 1)
  admin/        Next.js       → Vercel (project 2): review of extracted fields
  native/       Expo          → EAS
  crawler/      Node worker   → Docker host: long Firecrawl + PDF batches beyond Convex action limits
packages/
  backend/      Convex        → convex deploy; fronts import _generated/api
  shared/       end to end: Zod entities and primitives
  front-core/   front only, used by several fronts   (born with the second front)
  back-core/    back only, used by several backends  (born with the second backend)
  ui/           design system for the web fronts
```

- **A second backend nobody imports goes to `apps/`.** A crawler worker talks to Convex through its
  HTTP client and validates what it writes with `shared`; fronts never call it directly.
- **The web app is on Vercel** (one owner, Hobby plan, root `apps/web`, production branch `main`):
  Next 16's `proxy.ts`, `next/og` and `global-not-found` work there without an adapter, and the
  Convex integration is built in. Every push of the public repo builds a preview.
- **Each deployable ships on its own**, only when something it uses changed: a Vercel project per
  web app with `turbo-ignore` as the ignored build step; `convex deploy` in CI when
  `packages/backend` or `packages/shared` change; `turbo prune <app> --docker` for a worker image.
- **The contract changes everywhere at once, so deploy in order**: backend before fronts. Remove a
  field in two releases: first stop reading and writing it, then remove it. Convex refuses a schema
  that does not match the stored documents, which catches part of this, not all.

## 2. One shape, one Zod

The rule that ties the workspaces together: **one Zod declaration per concept**, travelling Convex
table → function args and returns → web data hook → form → screen; derived (`.pick`, `.omit`,
`.extend`), never retyped; parsed wherever data passes through `any`. Entities, primitives,
fields, fragments and naming: `packages/shared/AGENTS.md`. How the row travels between fronts and
backend, ports and the function builders: `docs/contracts.md`.

## 3. Backend (Convex)

The folder layout, how to run it and the Zod bridge findings: `packages/backend/AGENTS.md`. What
holds across folders:

- **A Convex table is an entity**; its Zod declaration lives in `packages/shared/entities/` and the
  Convex validator is **derived** from it, never written beside it. Functions are declared through
  builders that carry auth and Zod `args`/`returns` (`docs/contracts.md` §3).
- **Every outside input is parsed at the edge**, in the module that reads it, with a local Zod
  schema that is not an entity and not in `shared`: Mapas API responses and Firecrawl output in
  `ingestion/`, provider webhooks in `http.ts`, LLM output in `llm/` (every field nullable, each
  with a verbatim quote checked against the text: `docs/security.md` §3).
- **Nothing is invented.** Every amount, deadline and requirement shown comes from a stored field
  with its source link; a field not found is stored as `null` and shown as "não informado".
- **Only allowed sources**, batch crawling only: `docs/data-sources.md`.
- **The backend computes, the web displays.** Eligibility, gaps and deadlines are computed in
  Convex and stored (`matches`); the web and the WhatsApp bot never re-derive them.
- **Adapters for what may change**: the LLM behind `llm/` (Gemini free tier: a queue and retries in
  ingestion), message channels behind `alerts/` (Resend, Nvoip).
- **Ownership, abuse limits and secrets**: `docs/security.md`.

### Call notice lifecycle

A call notice (edital) fills in stage by stage, and each stage has **one writer**. Each stage is a
fragment of `call-notice` in `packages/shared`, born with the code that writes it: the stages marked
"later" are the agreed shape, not files to create now (§6).

| stage | what it adds | writer | where it comes from | when |
| --- | --- | --- | --- | --- |
| listed | `listing` (title, official page, document links, id at the source), `registration-window` | `ingestion/` per source kind | Mapas API; an official page through Firecrawl `/map` | **now** |
| seen | `tracking` (first and last seen) | the server, on every write | the clock | **now** |
| document read | `document`: which of `documentUrls` is the call notice, its Markdown, hash and when it was read | `ingestion/` | Firecrawl `/scrape` | PR C |
| extracted | `extraction`: amounts, applicant types, art forms, region, required documents, each `null` or with a verbatim quote | `llm/`, checked against the text | the document's Markdown | 16–18/11 |
| classified | whether it is a call for creators or noise (payment forms, council elections) and why | `llm/` + rules | the extraction | 16–18/11 |
| matched | not on the call notice: a `matches` row per creator × call notice, `eligible` / `almost` / `not` with reasons | `matching/` only | the extraction × the creator's portfolio | 19–22/11 |
| alerted | not on the call notice: an `alerts` row per message sent (creator, call notice, template, channel, status), so a reminder never goes twice | `alerts/` only | `matches` (`edital_compativel`, `quase_elegivel`), the window (`prazo_chegando`), a changed window or document (`edital_retificado`) | 19–25/11 |

- **A source kind decides only how a call notice is listed.** From "document read" on, every call
  notice follows the same path, whichever kind listed it. A `newsSite` lists nothing: it is a
  signal that sends the team to an official source.
- **A changed document reruns the stages after it**: a new hash means a new extraction, and an
  amended deadline means new matches and an alert ("o prazo mudou"). For that, `recordCallNotice`
  will report a changed window once `alerts/` exists to consume it.
- **WhatsApp and e-mail are channels of "alerted"**, behind the adapter in `alerts/`; they read
  what the stages stored and never compute (`docs/integrations/whatsapp.md`). Who writes and reads
  each part, folder by folder: `docs/contracts.md` §4.
- **Creator-facing lists show only call notices classified as calls for creators**; the noise stays
  stored, for the admin review.

### The database is Convex

One store, no second database. Convex is documents with a schema (the Zod entities), references by
typed `Id` with indexes, serializable ACID transactions, and full-text and vector search if they
are ever needed. What it lacks, and the answer here:

- **No SQL joins or aggregates**: a count is a counter kept by the writer, not a scan.
- **1 MiB per document**: a document's Markdown that may pass it goes to File Storage, the row
  keeping its hash and link.
- **Per function: 16 MiB read or written, 32,000 documents scanned, 1 s of user code** in queries
  and mutations: ingestion works in batches. Actions run up to 10 min (Node) or 30 min.
- **No unique constraint**: uniqueness is one mutation doing "look up by index → insert". Serializable
  transactions make that safe under concurrency, so **one natural key, one writer**.

### Errors

Functions are called over a WebSocket, not URLs: there is no status code and no response envelope.

- **An expected failure is thrown, never returned**: `throw appError({ code })`
  (`packages/backend/convex/appError.ts`), whose data is `AppErrorSchema` in `packages/shared`.
  Throwing also undoes every write the mutation made; returning `{ success: false }` would commit
  them. The data reaches the front intact.
- **Codes, not text**: `invalidInput` (with Zod's issues), `notFound`, `forbidden`, `conflict`,
  `unavailable`. The front words them in the reader's language (`packages/shared/AGENTS.md`,
  Messages).
- **An unexpected failure is not ours to shape**: Convex shows it as "Server Error" with a request
  id, and logs the stack.
- **`http.ts` is the only HTTP**: webhooks answer with a status from the code (`invalidInput` 400,
  `forbidden` 403, `notFound` 404, `conflict` 409, `unavailable` 503), born with the first webhook.
- **Calls to the outside carry a timeout**: `fetch(url, { signal: AbortSignal.timeout(ms) })` in
  every action; a source that does not answer ends as `unavailable`, not as a hung run (SP Cultura
  took over 90 s).
- **Public builders carry a rate limit** (`convex-helpers` `rateLimit`, already a dependency) when
  the first public function is written: `docs/security.md` §2.

### Idempotency and concurrency

**Concurrency is Convex's**: every mutation is a serializable transaction under optimistic
concurrency control; when two collide, Convex reruns one, so a read-then-write inside a mutation
never races. Queries and mutations are retried on Convex's internal errors. **Actions are neither
undone nor retried**: anything that touches the outside follows one of these patterns, chosen by
flow.

| pattern | how | Bratura flow | key |
| --- | --- | --- | --- |
| 1. Natural-key upsert | one mutation looks the key up in its index, then patches or inserts | a call notice from its source (`recordCallNotice`) | `sourceId` + `externalId` |
| 2. Content-addressed work | the same input is never processed twice | reading a document (Firecrawl credits), extracting it (Gemini quota) | the document's hash |
| 3. Outbox: reserve → act → confirm | a mutation reserves the row (`sending`), the action calls the outside, a mutation marks `sent` or `failed`; nothing is sent without a reserved row | WhatsApp and e-mail alerts | creator + call notice + template + occurrence (the D-7 of a given deadline) |
| 4. Inbox | the provider's event id is stored first; a repeated id answers 200 and stops | Nvoip webhooks, a payment webhook if it comes | the provider's event id |
| 5. Lease | at most one `running` row per job; a stale one (past its time limit) may be taken over | ingestion of a source, which a cron may fire while a run is still going | `sourceId` with status `running` |
| 6. Client intent | a front's mutation sets a state (`setX`) rather than adding one more; a create carries a natural key or one made by the client | the creator's forms (a double click) | the natural key, or a client-generated id |

## 4. Languages (pt-BR, en)

- **The locale is a primitive** (`packages/shared/src/primitives/external/locale/enum.ts`), a Zod
  enum of BCP 47 tags, so the same string goes in `lang`, `hreflang`, `Intl` and, later, the
  creator's profile and the language of alerts. It sits in `shared` ahead of its backend consumer
  by decision (2026-11-08): it is the one concept known to cross the wire.
- **pt-BR at `/`, English under `/en`**, by a proxy rewrite; routing details in
  `apps/web/src/app/AGENTS.md`.
- **Copy per locale, next to the section that shows it**: `apps/web/src/features/AGENTS.md`.
  Design-system components take copy as props. The name "Bratura" is the same everywhere; the
  slogan is translated per locale (decided 2026-11-09, for the international jury): `SITE_SLOGAN`
  in `features/common/config/site.ts`, and `packages/ui/AGENTS.md` for the `Logo` side.

## 5. Naming

- **Names are long and declarative**: the concept, never the mechanics. Converters are
  `<output>From<input>` (`siteMetadataFromLocale`). When the right name is not obvious, propose
  options and ask: a rename later is a diff across every caller.
- **The nature is in the file name**: `entity.ts`, `enum.ts`, `fields.ts`, `variant.ts`, `dto.ts`, `content.ts`,
  `*.page.tsx`, `*.mapper.ts`, `use*.ts`. Folders are kebab-case; component files PascalCase.
- **Domain language is English in code.** Product terms keep a Portuguese word only when the
  English loses meaning; decide per term and list it here. So far: none. An edital is a **call
  notice** (`call-notice`, `callNotices`; decided 2026-11-13); `opportunity` is only Mapas Culturais'
  name for it, used inside the Mapas client. A Convex module file cannot hold a hyphen, so modules
  are camelCase (`ingestion/callNotices.ts`).

## 6. What stops a new piece

- **A piece without a consumer does not enter**, however sure the future need looks.
- **Generalize at the second instance**, never from one example.
- **A well-named small function pays for itself with one consumer**; what is disqualified is
  generalizing it, not naming it. But a name does not justify a piece the native expression
  already says.
- **Prefer the platform**: a native API or the standard library before a dependency. Ask the team
  before adding one.

## 7. Open

- **The one Convex import in `shared`** (`documentId`, decided 2026-11-13) is open to the team's
  questioning: the exception and why, `packages/shared/AGENTS.md`.
- **Headless components for the app screens** (team analysis, 2026-11-12): keep `@bratura/ui` as
  the design system and add **React Aria Components** inside `packages/ui` as an unstyled layer for
  what the screens will need: portfolio upload (`DropZone`, `FileTrigger`), filters by state, city
  and art form (`ComboBox`, `Select`, `TagGroup`), deadlines and the portfolio timeline
  (`DatePicker`, `DateRangePicker`, `Calendar`), the document checklist (`CheckboxGroup`), a call
  in plain language (`Disclosure`, `Tabs`, `Dialog`/`Modal`), eligible / almost / not (`Meter`,
  `ProgressBar`), the org panel (`Table`), notices (`Toast`). Why: accessibility rigour (eMAG, axe), pt-BR built in, dates with time
  zones through `@internationalized/date` (the São Paulo zone and `hourCycle` traps of
  `primitives/AGENTS.md`), states styled with our tokens as `data-[focus-visible]`/`data-[selected]`
  variants, each wrapped as `components/<Name>/` with `focus-ring` and markup tests, and custom
  validation so the error text stays in the Zod declaration. Not a styled kit (MUI, Chakra, Mantine,
  Ant): their themes fight `@theme` and the identity; the gov.br design system is a reference for
  eMAG only. Alternative: shadcn/ui, faster to copy and already token-compatible (`background`,
  `primary`, `ring`…), with more dependencies (Radix, `class-variance-authority`, `tailwind-merge`,
  icons) and less i18n. A new dependency: the team decides before the first form. The 2026-11-08
  rule was "Radix only when a complex widget appears"; whichever wins replaces it. Already discarded
  with evidence (2026-11-08): Material UI (Google look, CSS-in-JS friction with Server Components,
  hides the design system) and Storybook for now (`/design` already ships with the site; axe in CI
  comes first; revisit after the demo works).
- **Validation messages in two languages**: "text lives in the Zod declaration" meets "copy exists
  in pt-BR and en" at the first form.
- **Enforcement**: these rules are prose. The ones visible in the syntax (a section importing
  another, `primitives` importing `entities`) become lint rules when they first break.

Every doc here is open for brainstorming: a rule that does not fit a case, or a simpler one, is a
discussion to open in the PR or with the team, not a reason to work around it in silence.
