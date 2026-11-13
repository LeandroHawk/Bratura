# Contracts

How data crosses between the fronts and the backend: which shapes exist, where they live, what a
front may send and what the backend accepts. The Zod mechanics (fields, fragments, `pick` or
`omit`, naming) are in `packages/shared/AGENTS.md`; who may read or write what is in
`docs/security.md`.

Status: **2026-11-13**, written before the first table. The first entity tests it; change this
file in the same PR when it does not hold.

## 1. One row, spread end to end

**The row the table stores is the shape the front sends and the backend handles.** Convex stores
plain JS objects in camelCase, with no ORM and no column mapping, so the entity in
`packages/shared` can be the table, the function args and the form at once. Every step derives
from it, so no step maps field by field:

| step | shape | how |
| --- | --- | --- |
| table | the entity | `zodToConvex(EntitySchema)` in `schema.ts` |
| a read returns | the row or a whitelist of it | `withSystemFields(...)` (adds `_id`, `_creationTime`), or `.pick` |
| a write takes | the fragments its writer owns | `ListingFields.extend(WindowFields.shape)`: never what the server sets |
| the backend stores | the args plus what the server sets | `ctx.db.insert('table', { ...args, ...serverSet })` |
| a form edits | the write args plus UI-only fields | `.extend({ ... })`, in the feature |

- **Split an entity's fragments by who writes them**, and the boundary between front and back
  becomes a spread, not a list: a fragment for what the creator types, one for what the server sets
  (owner, status, timestamps), one for what ingestion extracts. A write's args are then the spread
  of its writer's fragments (`recordCallNotice`: listing + window), and the server's fragment is
  simply absent. Not `.omit({ ...ServerSetFragment.shape })`: Zod 4's `omit` takes `true` per key,
  so a fragment's shape fails `tsc`. A spread lets a duplicate key win in silence, so an entity built
  from fragments gets a test that the fragments do not share a key.
- **What the server sets never comes from the front**, even when the front could send the right
  value: owner, status, derived values (eligibility, gaps) and anything computed. `docs/security.md` §1.
- **A UI-only field never reaches `insert`.** A Zod object strips unknown keys when it parses, and a
  Convex validator rejects them: parse the args with the write schema, never forward the form's object.
- **Reuse one field with `Schema.shape.field`** (a single-field check, a filter param), never a copy.

## 2. Ports: who calls

A port is a way into the backend. Two today: **the site** (`bratura-portal`) and **WhatsApp**. Both
reach the same Convex functions and read the same tables (`matches`, `applicationKits`), so the two
channels never disagree.

```
packages/shared/src/entities/<entity>/
  entity.ts                                    the row
  enums/  fragments/
  dto/
    common/<concept>/<query|mutation>.ts       shapes both ports use
    bratura-portal/<concept>/<query|mutation>.ts   only the site
    whatsapp/<concept>/<query|mutation>.ts     only when WhatsApp needs its own shape
```

- **The folder is the Convex function kind, not an HTTP verb**: `query` reads, `mutation` writes,
  `action` calls the outside world. Fronts call functions, not URLs; HTTP exists only in `http.ts`.
- **A DTO starts in its port's folder** and moves to `common/` when the second port uses it (the
  three-levels rule of `docs/architecture.md` §1, applied to ports).
- **A provider's payload is not a DTO.** What Nvoip, Firecrawl or Mapas send is parsed by a local Zod
  schema in the backend module that reads it (`http.ts`, `ingestion/`), then translated into a call
  to the same functions the site uses. It never enters `shared`.
- **Names**: `<Concept><Query|Mutation>From<Port>{Args,Returns}Schema`, e.g.
  `EligibleCallNoticesQueryFromBraturaPortalArgsSchema`. Long on purpose: the name is what a grep
  finds.

## 3. Declaring a function: the `withRoute` of Convex

In a Next.js backend one wrapper (`withRoute`) declares auth, parses input, validates output and
maps errors. In Bratura that is `packages/backend/convex/builders.ts`: builders take Zod `args`
and `returns`, parse both whole, and (once there is a caller) resolve auth before the handler.

- **Auth is declared once, in the builder**: `publicQuery`, `creatorQuery`, `creatorMutation`,
  `orgMemberQuery`, `adminMutation`, built in `packages/backend` beside the internal ones. The builder
  resolves the caller and puts it in `ctx` (`ctx.creator`); a function picks a builder, it does not
  check auth by hand. A public function is a visible choice (`publicQuery`), not a missing check.
- **Every function declares `args` and `returns`** from the DTOs above. The output check is what
  stops a read from leaking a field the whitelist left out.
- **Errors**: a schema returns violations as data; the function decides what is terminal and throws
  `appError({ code })`, never a text: the front words the code (`docs/architecture.md`, Errors).
- **The builders are ours**, not convex-helpers' `zCustom*` (`packages/backend/AGENTS.md`, The Zod
  bridge).

## 4. Writers and readers

**Before changing what a write stores, find every writer and every reader of that field**
(`git grep` the field name in `packages/` and `apps/`) and read them. A field changed by one writer
and read under an old assumption by another breaks without a type error.

- **A derived value has one writer.** Eligibility and gaps are written by `matching/` only; the web
  and the WhatsApp bot read them and never recompute.
- **Every stored fact knows where it came from**: an ingested field keeps its source link and its
  evidence quote; a field the creator typed is the creator's. The fragment it belongs to (§1) says
  which.
- **A test that a write stores something pairs with a test that a reader reads it.**

### Where each answer lives in the tree

The folders answer three questions without opening a doc. **Who writes and where it comes from**:
the fragment, whose header says it (`Writes: … Comes from: …`), and the backend module it names.
**Where it is read from**: the `ingestion/` folder of a source kind. **Who reads**: the port folder
of a DTO (§2). Stages and dates: `docs/architecture.md`, Call notice lifecycle.

```
packages/shared/src/entities/call-notice/
  fragments/                one fragment = one writer; its header names both
    listing/  registration-window/  tracking/
    document/  extraction/                                  (later)
  dto/                      who reads, one folder per port (§2)
    bratura-portal/  whatsapp/                              (later)

packages/backend/convex/
  ingestion/
    sources.ts              the team registers a source
    callNotices.ts          the call notice's only writer
    mapasCulturais/  officialPage/  newsSite/               (later) one reader per source kind
  llm/  matching/  alerts/  http.ts                         (later)
```

- **The source-kind folders mirror each other**: `entities/source/kinds/<kind>/` declares a kind,
  `ingestion/<kind>/` reads it (camelCase there: Convex rejects a hyphen in a module path).
- **A writer's args stay beside the writer** when no port calls it: ingestion is not a port, so
  `recordCallNotice`'s args live in `ingestion/callNotices.ts`, not in `dto/` (`shared` holds only
  what crosses the wire).

## Open for brainstorming

This file is a first version, not a settled spec. If a rule here does not fit a case, or a simpler
one would do, open the discussion in the PR or with the team. Known open points:

- Port names: `bratura-portal` and `whatsapp`, or one folder per front (`web`, `whatsapp`)?
- Whether `orgs/` becomes a third port (the organization panel) or stays inside the site.
