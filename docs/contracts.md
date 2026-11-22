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

A port is a way into the backend. Two today: **the site** (`bratura-portal`) and a **message
channel** (Telegram today, WhatsApp planned). Both reach the same Convex functions and read the
same tables (`matches`, `applicationKits`), so the two channels never disagree.

```
packages/shared/src/entities/<entity>/
  entity.ts                                    the row
  enums/  fragments/
  dto/
    common/<concept>/<query|mutation>.ts       shapes both ports use
    bratura-portal/<concept>/<query|mutation>.ts   only the site
    telegram/<concept>/<query|mutation>.ts     only when Telegram needs its own shape
```

- **The folder is the Convex function kind, not an HTTP verb**: `query` reads, `mutation` writes,
  `action` calls the outside world. Fronts call functions, not URLs; HTTP exists only in `http.ts`.
- **A DTO starts in its port's folder** and moves to `common/` when the second port uses it (the
  three-levels rule of `docs/architecture.md` §1, applied to ports).
- **A provider's payload is not a DTO.** What Telegram, Firecrawl or Mapas send is parsed by a local Zod
  schema beside the backend client that reads it (`model/<provider>/payload.ts`), then translated into a call
  to the same functions the site uses. It never enters `shared`.
- **Names**: `<Concept><Query|Mutation>From<Port>{Args,Returns}Schema`, e.g.
  `EligibleCallNoticesQueryFromBraturaPortalArgsSchema`. Long on purpose: the name is what a grep
  finds.
  A function no port calls (ingestion, crons) drops `From<Port>` and keeps its schemas beside it:
  `GetMapasCulturaisInstanceQueryArgsSchema`, `StartIngestionRunMutationReturnsSchema`. Never
  `Request`/`Response`: a function is not an HTTP call.

## 3. Declaring a function: the `withRoute` of Convex

In a Next.js backend one wrapper (`withRoute`) declares auth, parses input, validates output and
maps errors. In Bratura that is `packages/backend/convex/lib/builders.ts`: builders take Zod `args`
and `returns`, parse both whole, and (once there is a caller) resolve auth before the handler.

- **Auth is declared once, in the builder**: `publicZodQuery` (exists), then `creatorQuery`,
  `creatorMutation`, `orgMemberQuery`, `adminMutation`, built in `packages/backend` beside the
  internal ones. The builder resolves the caller and puts it in `ctx` (`ctx.creator`); a function
  picks a builder, it does not check auth by hand. A public function is a visible choice
  (`publicZodQuery`), not a missing check.
- **`publicZodQuery` has no caller**: anyone with the deployment's URL may call it, so its handler
  reads only what a visitor may see, a page at a time or through a bounded index range. Until the
  sign-in exists (after 30/11) the call screens' reads are public and answer for one profile, the
  fictional creator; "the full list needs the sign-in" is held by the web's demo sign-in only. When
  `creators` exists, those reads move to `creatorQuery` and only `callNoticeHighlights` stays
  public.
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
  and the Telegram bot read them and never recompute.
- **Every stored fact knows where it came from**: an ingested field keeps its source link and its
  evidence quote; a field the creator typed is the creator's. The fragment it belongs to (§1) says
  which.
- **A test that a write stores something pairs with a test that a reader reads it.**

### Where each answer lives in the tree

The folders answer three questions without opening a doc. **Who writes and where it comes from**:
the fragment, whose header says it (`Writes: … Comes from: …`), and the backend module it names.
**Where it is read from**: the `model/` folder of a source kind. **Who reads**: the port folder
of a DTO (§2). Stages and dates: `docs/architecture.md`, Call notice lifecycle.

```
packages/shared/src/entities/call-notice/
  fragments/                one fragment = one writer; its header names both
    listing/  registration-window/  tracking/
  dto/                      who reads, one folder per port (§2)
    bratura-portal/  telegram/                              (later)
packages/shared/src/entities/call-notice-document/  one row per document read (its own table)
packages/shared/src/entities/call-notice-document-text/  its text, one row per read (its own table)
packages/shared/src/entities/call-notice-extraction/  one row per call extracted (its own table)

packages/backend/convex/    a root file is a door (Convex functions); model/ is what doors share
  sources.ts                the team registers a source; ingestion reads one, or the active ones
  callNotices.ts            the call notice's only writer
  ingestion.ts              the process, not an entity: the daily schedule, one action per
                            source kind, the run lease (the only writer of `ingestionRuns`)
  documents.ts              which documents are worth credits, the read by hand through
                            model/firecrawl, the only writer of `callNoticeDocuments` and
                            `callNoticeDocumentTexts`
  model/
    ingestion/runSourceIngestion.ts  the loop every kind shares: lease, parse, record, count, close
    mapasCulturais/         the Mapas reader: client, edge Zod (payload.ts), listing, date
    firecrawl/              clients of the outside APIs, each with its payload.ts
    telegram/               the message channel: sendMessage.ts (the only import), client.ts +
                            payload.ts (the Bot API: getMe, sendMessage); the text is
                            `shared/messages/user-notification`
    callNoticeDocuments/    selection.ts: which calls and files are worth reading, from the listing
    llm/                    generateJson.ts (the only import; provider and model from env), evidence.ts
  crons.ts  http.ts         Convex's entry files
  extraction.ts             fields from the read documents, by hand, through model/llm; the only
                            writer of `callNoticeExtractions`
  userNotifications.ts      what to tell a user: the web inbox (the only writer of
                            `userNotifications`)
  userMessageChannels.ts    where a user is reachable, opt-in and opt-out (the only writer of
                            `userMessageChannels`)
  notificationDeliveries.ts how it left the site: the send outbox (the only writer of
                            `notificationDeliveries`)
  users.ts                  the user's only writer
  matching.ts               how each call fits the profile (the only writer of `matches`) and the
                            call screens' reads
  telegram.ts                                               (a skeleton)
```

- **A source kind brings only what is its own** (`SourceReader` in `runSourceIngestion.ts`): how
  to fetch, its edge Zod, its mapping to a listing. A new kind is a `model/` folder, an action in
  `ingestion.ts` and a line in `ingestActionByKind`, which fails `tsc` until the kind is mapped.
- **The source-kind folders mirror each other**: `entities/source/kinds/<kind>/` declares a kind,
  `model/<kind>/` reads it (camelCase there: Convex rejects a hyphen in a module path).
- **A writer's args stay beside the writer** when no port calls it: ingestion is not a port, so
  `recordCallNotice`'s args live in `callNotices.ts`, not in `dto/` (`shared` holds only
  what crosses the wire).

## Open for brainstorming

This file is a first version, not a settled spec. If a rule here does not fit a case, or a simpler
one would do, open the discussion in the PR or with the team. Known open points:

- Port names: `bratura-portal` and `telegram`, or one folder per front (`web`, `telegram`)?
- Whether `orgs/` becomes a third port (the organization panel) or stays inside the site.
- When the team registers a source's state and level: add them to `sources` and bring back the
  location filters (the portal DTOs carry no `state`, `city`, `coverage` or `opportunityKind`: no
  stored field gives them).
- When a list must be filtered by art form, applicant type, text or "amount informed": copy the
  field to `matches` with its index (a search index for the title); never filter a whole list in
  the browser.

## Demo profile boundary and next triggers

`callNoticeDetails` accepts an optional `MatchProfileSchema`, derived from creator and portfolio
entities. `matchProfileFromPortfolio` strips identities, biography, descriptions, links and file
metadata before the public query; only facts needed by matching cross the wire. This is a demo
calculation, never an ownership assertion. Lists/counters use the fixed fictional creator.
`matches.artForms` is an optional cached list for older rows; run `recomputeMatches` after deploying
to populate it. The cards never read the extraction for that list.

## Open for brainstorming — demo exit

- When creator-owned persistence is implemented: create `creators` and `portfolioItems` from the
  shared entities, key matches by authenticated creator, replace `demoStore` and move private
  reads to `creatorQuery` with centralized owner checks.
- When WorkOS login and backend accounts are scheduled after 30/11: resolve the caller in builders,
  implement real sessions and account lifecycle, and replace the browser-only gate.
- When organization support is approved: add multiple profiles and memberships per account and
  enable `organizationRecords` / `groupRepresentation` for those profiles.
- When notification classification is unified: first inspect development `userNotifications` for
  `matchStatus: 'almost'`, migrate old rows with the owning developer, then derive the notification
  values from `MatchClassificationEnum`. No deployment was inspected or migrated in this audit.
