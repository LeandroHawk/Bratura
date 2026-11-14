# packages/shared — the contract

`@bratura/shared` holds what the web app **and** the backend import: Zod declarations of the
product's concepts. It is the end-to-end level of "shared" (`docs/architecture.md` §1). A piece
belongs here only when it crosses the wire and has a consumer on the other side **today**.

Today it holds the locale, `requiredString`, `documentId`, and the entities of the first Convex
tables: `source`, `call-notice`, `ingestion-run`.

```
src/
  entities/<entity>/           has a table: identity, lifecycle, an owner      (with the backend)
    entity.ts                  the row, built by spreading its fields and fragments
    enums/                     values that belong to this entity only
    fragments/                 a part of THIS entity (rules below)
    kinds/<kind>/variant.ts    one variant of an entity that is a union by kind (`source`)
    dto/<port>/<concept>/<query|mutation>.ts   args and returns of one function, per port
                               (common/, bratura-portal/, whatsapp/: docs/contracts.md §2)
  primitives/                  no identity: two equal values are the same value
    code/  domain/  external/  → primitives/AGENTS.md
```

Imports go by subpath, no barrels: `@bratura/shared/primitives/external/locale/enum`.

## One shape, one Zod

One declaration per concept travels the whole chain: Convex table → query/mutation args and
returns → web data hook → form → screen. Two descriptions of one shape drift where the compiler
cannot see: two hand-written declarations of the same record have drifted apart with `tsc` green
in a sibling project.

Before declaring anything:

1. **Look for it**: `git grep` the concept here first.
2. **Derive, don't retype**: `.pick()`, `.omit()`, `.partial()`, `.extend()` off the entity, so a
   rename propagates or breaks `tsc`.
3. **Parse where the chain passes through `any`**. A type annotation guarantees nothing there.
   In this project that is mostly ingestion: the Mapas Culturais API, pages and PDFs read by
   Firecrawl, and LLM extraction output. Also URL params (`[lang]` is parsed with `LocaleEnum`),
   `JSON.parse` and storage.

## Entity or primitive

> **Does it have a table?** Then it has identity, a lifecycle and an owner → **entity**.
> **No table?** Then two equal ones are the same value → **primitive**.

Two `callNotices` rows with the same title are not the same call; `'MEI' === 'MEI'`.

- **A catalog with a table is an entity.** `sources` (the Mapas Culturais instances and official
  pages we read) looks like a fixed list, but it is a Convex table someone edits: it has an owner.
- **A part of one entity is not a top-level thing.** The evidence quote attached to each
  extracted field has no table and is not a universal value: it is a fragment of the call notice.
- **Planned tables** (`docs/plan.md`, What to build): `sources`, `callNotices`, `ingestionRuns`,
  `creators`, `portfolioItems`, `matches`, `applicationKits`, `alerts`, `organizations`,
  `memberships`. Each becomes `entities/<kebab-name>/` when its table is written.

## Fields compose upwards, entities spread them

The Zod rule of a field lives in the subject whose rule it **adds**, not the type that travels on
the wire:

```
primitives/code/<type>/fields.ts       the mechanism: requiredString, requiredUrl, requiredDate
        ↓ composed by
primitives/external|domain/<subject>/  the subject's rule: requiredCnpj, requiredUf
        ↓ composed by
entities/<entity>/                     the field of that entity, and only of it
```

An entity is the **spread** of its parts, so you read the whole row in one place:

```ts
// entities/call-notice/entity.ts
export const CallNoticeSchema = z.object({
  ...CallNoticeListingFields.shape, // source, id there, title, official page, document link
  ...CallNoticeRegistrationWindowFields.shape, // when applications open and close
  ...CallNoticeTrackingFields.shape, // first and last seen, set by the server
});
```

A `fragments/` file earns its place only if at least one is true:

1. it is **spread** into an `entity.ts`;
2. two entities declare that **same shape**;
3. a test asserts that something **derives** from it.

A `.pick()` off the entity is not a fragment: fragments compose, `pick` derives. Calling a pick a
fragment sends the reader to `fragments/` looking for something to spread.

## Where a piece goes: what it decides, not what it mentions

> **A piece belongs to the subject whose lifecycle it governs.**

With pieces this project will need (none exists yet):

| piece                                        | mentions        | decides about     | lives in                                 |
| -------------------------------------------- | --------------- | ----------------- | ---------------------------------------- |
| `MeiStatusEnum`                              | —               | MEI registration  | `primitives/external/mei-status/`        |
| `CallRequirementEnum` (MEI, SICAB, CCMEI…)   | MEI, SICAB      | what a call asks  | `entities/call-notice/enums/`            |
| "is this creator eligible for this call?"    | MEI, the call   | a **match**       | backend `matching/`, not `shared`        |

The naive rule, "it goes where the value it names lives", is wrong: the eligibility check names
MEI but decides a match. If two or more entities need a piece and none owns the decision, it is a
primitive.

**The backend computes, the web displays.** Eligibility and gaps are computed in Convex and read by
the web as data (`matches`). A rule only the backend answers lives in the backend, even if it
"could" serve the web: a planned consumer is not a consumer.

## Picking a subset: `pick` or `omit`

|           | a new column on the entity | use it for                                            |
| --------- | -------------------------- | ----------------------------------------------------- |
| `.pick()` | stays **out** of the subset | whitelists: what a form edits, what a role may see   |
| `.omit()` | goes **in** on its own     | mirrors: what a payload carries, what a cache stores  |

Using the same mechanism for both is the bug: in a mirror, a new column left out means the payload
silently carries less than the row. Name a subset when the same list appears a second time.

## Errors, invariants, and what never lives here

- **The error text lives in the Zod declaration; the web only displays it.** A form resolves
  against the contract schema and renders `error.message`; no message is written in a component.
  Re-describing a schema by hand on the front is how a sibling project ended up showing Zod's
  English default messages to Portuguese users.
- ⚠️ **Open: messages in two languages.** "Text lives in the Zod declaration" and "copy exists in
  pt-BR and en" meet at the first form. Decide then (`docs/architecture.md`, Open).
- **"If A then B exists"** → `z.discriminatedUnion` first. **"A compared with B"** (the
  registration window closes after it opens) → a `with…` function next to the entity that adds the
  `refine`, so both sides run one check (`withOrderedRegistrationWindow`). Never on the entity
  itself: Zod 4 throws on `.pick`/`.omit`/`.partial` of a refined object, so the rule is attached
  last, to the schema that parses.
- **No conversion in an entity**: no `.transform`, `.pipe` or `z.preprocess`. Convex builds the
  table from the input side: a transform gives the column the input type (the write is refused) and
  a preprocess gives it `any` (the column accepts anything). Overwrites that keep the type
  (`.trim()`) are fine. Converting is the edge's job: the Mapas client turns its date strings into
  instants, a form turns text into numbers. `entities/no-conversion.test.ts` reads every entity
  module and fails on one.
- **Every text from outside has a ceiling**, picked by name from `textLengths` (`short`, `medium`,
  `long`, `max`): `requiredString('long')`, `nullableString()`. A number cannot be passed, so a
  ceiling is raised only by a new row in the table. Links: `requiredHttpsUrl` (ours),
  `requiredHttpUrl` (from a source), both capped.
- **Nothing here throws a backend error class.** Return a violation as data; the Convex function
  decides whether it is terminal (`ConvexError`). An error class is backend code; a schema crosses
  the wire.
- **Nothing here imports Convex, Next or React.** Both sides must be able to import any file. One
  exception, held by lint to one file: `primitives/code/id/fields.ts` re-exports convex-helpers'
  `zid` as `documentId`, so a reference to another row has the backend's `Id<'table'>` type
  (validators only, from `convex/values`; the web depends on `convex` for its client anyway).

## Messages

The error text a person reads lives in `src/messages/`, the one place in this package with pt-BR
and en copy: a Zod error map per locale (issue code and its numbers → text) and a text per
`AppErrorCode`. Fields carry no text; a rule of our own names its message with
`params: { message: '<key>' }`. The map is applied where an error is shown (a form's parse, a
caught `appError`), with the reader's locale. Zod's built-in `pt` locale is not used: it is
European Portuguese and reads like a log ("Demasiado grande: esperava que o texto tivesse <= 5
caracteres"). Born with the first form; until then only the team reads errors, raw.

## Naming

- **Every subject is a folder, even with one file**, and the file name says the nature:
  `entity.ts`, `enum.ts`, `fields.ts`, `dto.ts`, and `<subject>.ts` for its functions
  (`calendar.ts`). Growing then adds a file; it never rewrites a
  consumer's import. Promoting a 19-consumer file to a folder later cost 21 import rewrites in a
  sibling project.
- **The symbol suffix says the nature too**: a Zod enum ends in `...Enum` (`LocaleEnum`); what
  validates a field or an entity ends in `...Schema`. Without the split, `XEnum` and `XSchema`
  end up meaning the same thing.
- **Zod or a plain union**: a value that crosses the wire (DTO, URL, a table) is a Zod enum; a
  value born and dead in code is a TypeScript union. The trigger is crossing a boundary, not
  "being more correct": `Locale` is a Zod enum here because the `[lang]` URL segment and, later,
  the creator's profile carry it.

Tests sit next to the file (`enum.test.ts`) and run with `pnpm test`.
