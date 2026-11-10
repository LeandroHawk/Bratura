# Architecture

How Bratura is laid out and why, across folders. The rules of each folder live **in that folder**,
in its `AGENTS.md`; this file is the map, the decisions that cross folders, and the backend until it
has a folder of its own. `AGENTS.md` at the root lists the rules in one line each.

Status: **2026-11-08.** The web app and the design system follow it. `packages/shared` holds one
primitive (the locale). The backend does not exist yet: §3 describes the shape it is born with.

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
fields, fragments and naming: `packages/shared/AGENTS.md`.

## 3. Backend (Convex)

Moves to `packages/backend/AGENTS.md` when the package is created.

```
packages/backend/convex/
  schema.ts       tables, derived from the Zod entities in packages/shared
  http.ts         WhatsApp webhook (GET verify + POST messages)
  crons.ts        scheduled ingestion and deadline alerts
  ingestion/      sources, Mapas Culturais client, Firecrawl client, PDF extraction, classification
  portfolio/      uploads, timeline, portfolio PDF, public page data
  matching/       eligibility and gaps per creator × call
  alerts/         deadline alerts (Resend e-mail, WhatsApp)
  orgs/           organizations and memberships
  llm/            the provider adapter (Gemini free tier) and its prompts
```

- **A Convex table is an entity**; its Zod declaration lives in `packages/shared/entities/` and the
  Convex validator is **derived** from it, never written beside it.
  ⚠️ **Open, before the first table:** how the bridge behaves, not whether it exists.
  `convex-helpers` 0.1.134 (2026-11-05) takes `zod ^4` as a peer and exports
  `convex-helpers/server/zod4`. Still to check on the first table: a Convex validator is only a
  shape, so refinements (`superRefine`, `.min()` on a string) and transforms cannot live in
  `schema.ts`; confirm that function args go through the full Zod parse, and parse the rest inside
  the function.
- **Every outside input is parsed at the edge**, in the module that reads it, with Zod:
  - **Mapas Culturais API** responses: the module's own schema of the API's shape, in
    `ingestion/`. It is not an entity and not in `shared`: only ingestion reads it.
  - **Firecrawl** pages and PDFs: text in, then the LLM extracts.
  - **LLM output**: a schema where every field is nullable and each non-null field carries a short
    verbatim evidence quote. Parsed with `safeParse`; a failure is a retry, never a guess.
- **Nothing is invented.** Every amount, deadline and requirement shown comes from a stored field
  with its source link; a field not found is stored as `null` and shown as "não informado".
- **Only allowed sources** (`devin-followup.md` §5): respect robots.txt and terms, batch crawling
  only, never the excluded sites.
- **The backend computes, the web displays.** Eligibility, gaps and deadlines are computed in
  Convex and stored (`matches`); the web never re-derives them.
- **The LLM sits behind `llm/`** so the provider can change; free-tier limits mean a queue and
  retries in ingestion, and only public call text and the fictional demo creator are sent.
- **Errors**: shared schemas return violations as data; a Convex function decides what is terminal
  and throws `ConvexError` with a message the web can show.
- **Secrets** live in Convex and Vercel environment variables, never in the repo.

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
- **The nature is in the file name**: `entity.ts`, `enum.ts`, `fields.ts`, `dto.ts`, `content.ts`,
  `*.page.tsx`, `*.mapper.ts`, `use*.ts`. Folders are kebab-case; component files PascalCase.
- **Domain language is English in code.** Product terms keep a Portuguese word only when the
  English loses meaning; decide per term and list it here. So far: none (`opportunity`, `call`).

## 6. What stops a new piece

- **A piece without a consumer does not enter**, however sure the future need looks.
- **Generalize at the second instance**, never from one example.
- **A well-named small function pays for itself with one consumer**; what is disqualified is
  generalizing it, not naming it. But a name does not justify a piece the native expression
  already says.
- **Prefer the platform**: a native API or the standard library before a dependency. Ask the team
  before adding one.

## 7. Open

- **Convex × Zod bridge** (§3).
- **Validation messages in two languages**: "text lives in the Zod declaration" meets "copy exists
  in pt-BR and en" at the first form.
- **Enforcement**: these rules are prose. The ones visible in the syntax (a section importing
  another, `primitives` importing `entities`) become lint rules when they first break.
