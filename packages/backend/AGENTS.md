# packages/backend — Convex

The backend: tables, ingestion, matching, alerts. It computes; the web and the WhatsApp bot display
what it stores. Cross-folder reasoning stays in `docs/architecture.md`; how functions are declared
in `docs/contracts.md` §3; ownership and abuse in `docs/security.md`.

```
convex/
  schema.ts       tables, derived from the Zod entities in packages/shared      } Convex's own
  crons.ts        the daily ingestion (09:00 UTC); deadline alerts later        } entry files:
  http.ts         routes only: Nvoip inbound, Firecrawl webhooks   (not yet)    } fixed names
  lib/            builders.ts (Zod args/returns), appError.ts: no functions

  sources.ts      the sources the team registers and ingestion reads
  callNotices.ts  the call notice's only writer
  ingestion.ts    the daily schedule, one action per source kind, the run lease (`ingestionRuns`)
  documents.ts    a call notice's documents read as Markdown (Firecrawl)        (not yet)
  extraction.ts   a call notice's fields from its Markdown (the LLM)            (not yet)
  whatsapp.ts  portfolio.ts  matching.ts  alerts.ts  orgs.ts                    (not yet)

  model/          plain TypeScript the files above call: never a Convex function
    ingestion/       runSourceIngestion.ts, the loop every source kind shares
    mapasCulturais/  client.ts (the API), payload.ts (its Zod), listing.ts, date.ts
    firecrawl/  nvoip/  llm/   clients of the outside APIs and the LLM adapter     (not yet)
  _generated/     written by the Convex CLI; committed, never edited by hand
```

**A root file is a door; `model/` is what the doors share** (Convex's "Best Practices": thin
functions over plain helpers). A subject's functions and its table's `ctx.db` live in one root file,
its tests beside it (`ingestion.ts` is the only writer of `ingestionRuns`). `model/` is named by
what it talks to: an outside API (`mapasCulturais/`, `firecrawl/`, `nvoip/`) or a loop several doors
run (`ingestion/`). **A provider we may swap is named by what it does** (`llm/`): doors import one
neutral function (`llm/generateJson.ts`), which alone picks the client and reads its key; a fixed
one is named by itself (`mapasCulturais/` is the source). `nvoip/` gets its channel adapter with the
first alert. A root file past ~6 functions becomes a folder of the same name, one file per door.

## Running it

```bash
cd packages/backend
pnpm convex          # convex dev: pushes convex/ on every save, regenerates _generated/
pnpm test            # convex-test: the functions against an in-memory backend, no deployment
```

`pnpm convex` the first time asks to log in or to run locally. **Local** (no account) runs a
backend on `127.0.0.1:3210` with its own data: enough to write functions and tests. A cloud
deployment in the team's Convex project comes when the web app needs one. Settings live in
`.env.local` (`CONVEX_DEPLOYMENT`, `CONVEX_URL`), never committed. It is not the root `pnpm dev`:
that would start an interactive login inside turbo for anyone who has not set Convex up.

Run one ingestion by hand, against the deployment `pnpm convex` points at:

```bash
pnpm exec convex run ingestion:ingestMapasCulturaisInstance '{"sourceId":"…"}'
pnpm exec convex run ingestion:scheduleDailyIngestion '{}'
```

Secrets (`FIRECRAWL_API_KEY`, the Nvoip and LLM keys) live **only** in the deployment's
environment: `pnpm exec convex env set NAME` with no value prompts for it, so it stays out of shell
history.

## Rules

- **A table is its entity's Zod**: `defineTable(zodToConvex(EntitySchema))`. Never a validator
  written beside the entity (`docs/architecture.md` §3).
- **Every function goes through a builder** in `lib/builders.ts`, with Zod `args` and `returns`. Only
  internal builders exist today: callable from other functions, crons, the CLI and the dashboard,
  never from a browser.
- **A reference to another row is `documentId('table')`** (`@bratura/shared/primitives/code/id/fields`):
  its type is `Id<'table'>`, the table stores `v.id('table')`, and an id from the wrong table fails
  both `tsc` and the write. A natural key (`sources.slug`) is for people and seeds, never a reference.
- **Outside input is parsed at the edge**, in the module that reads it, with a local Zod schema:
  `payload.ts` beside the client in `model/` (Mapas, Firecrawl, Nvoip), webhooks in their subject's
  file, LLM output in `model/llm/`.
- **Nothing is invented**: a field the source does not give is `null`.
- **A write sends only its own fragments.** `recordCallNotice` takes the listing and the registration
  window; tracking is set by the server and refused from a caller. Which stage writes which
  fragment: `docs/architecture.md`, Call notice lifecycle.
- **Module files are camelCase** (`model/mapasCulturais/`): Convex rejects a hyphen in a module
  path ("can only contain alphanumeric characters, underscores, or periods").
- **An expected failure is `throw appError({ code })`** (`lib/appError.ts`), never a returned
  `success: false` (the mutation's writes would commit) and never a text. The builder throws
  `invalidInput` with Zod's issues; `addSource` throws `conflict`. Codes and HTTP statuses:
  `docs/architecture.md`, Errors.
- **Every `fetch` to the outside has a timeout** (`AbortSignal.timeout`), and every side effect
  outside Convex follows an idempotency pattern: `docs/architecture.md`, Idempotency and
  concurrency.
- **A module that schedules or calls its own functions writes its handlers' return types**
  (`ingestion.ts`, `model/ingestion/runSourceIngestion.ts`): without them TypeScript cannot type the generated API and turns all of `internal`
  into `any`, silently disabling every `Id` check in the package.
- **Args are an object.** An entity that is a union (`SourceSchema`) goes under a key:
  `addSource({ source })`.

## The Zod bridge: what is checked where (tested in `sources.test.ts`, `callNotices.test.ts`)

`zodToConvex` turns an entity into a Convex validator, which is **only a shape**: `slug` becomes
`v.string()`, the regex is gone. Our builders (`lib/builders.ts`) close the gap:

1. **Convex checks the shape** and rejects unknown keys, before any code runs.
2. **The whole Zod `args` schema parses**: field rules (`regex`, `z.url({ protocol })`, `.min`)
   reject, overwrites (`.trim()`) reach the handler applied, and **rules across fields hold**. A
   failure throws `ConvexError` with the Zod issues.
3. **`returns` parses the result**, so a read cannot leak a field its schema left out.

Why not convex-helpers' `zCustomQuery`/`zCustomMutation`: they rebuild `z.object(shape)` from the
args (read in 0.1.131, `server/zod4.js`), which drops every rule across fields. We use only its
conversions (`zodToConvex`, `zodToConvexFields`, `zid`).

**A rule across fields is attached last**, to the schema that parses
(`withOrderedRegistrationWindow(CallNoticeListingFields.extend(…))`): why, `packages/shared/AGENTS.md`,
Errors, invariants.

## Tests

`convex-test` runs the real functions against the real schema in memory, in the edge runtime
(`vitest.config.ts`). `convex/test.setup.ts` lists the modules for it. A test sits next to the
module it covers (`sources.test.ts`, `model/mapasCulturais/listing.test.ts`); shared test data is a
`*.fixture.ts` beside them (`sources.fixture.ts`). The Convex CLI skips any file name with two dots, so tests and
fixtures never deploy.
