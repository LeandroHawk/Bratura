# primitives — values with no identity

A primitive has no table: two equal ones are the same value. Read `../../AGENTS.md` first (entity
or primitive, one Zod per concept); this file covers what goes **inside** `primitives/`.

**`primitives/` is not where new code goes.** New contract work lands in an entity. A piece moves
down here when two entities need it and neither owns the decision. "It is a primitive" is not a
reason by itself: a sibling project filled its `primitives/` with wrappers around native JS and had
to delete them.

## Three folders, split by who controls the concept

| folder                | who controls it                                          | Bratura examples                                                   |
| --------------------- | -------------------------------------------------------- | ------------------------------------------------------------------ |
| `code/<subject>/`     | the code: data structures, parsing, formatting           | `string/`, `date/`, `url/`, `id/`                                  |
| `domain/<subject>/`   | the business, when it names a combination of code notions | `money/` (an amount in BRL), `deadline/` (a registration window) |
| `external/<subject>/` | neither: law, an agency, an outside standard             | `locale/` (BCP 47, **exists**), `cnpj/`, `uf/`, `ibge-city/`, `mei-status/` |

`Math.round` does not mean money; composed with the BRL rules it becomes `money/` and gets a
business name. We do not decide what a CNPJ is or which states exist: that puts them in
`external/`. Only `external/locale/` exists today; the others are where those concepts go when
their first entity needs them, not files to create now.

## Dependency is one way

```
domain/, external/  →  code/
primitives never import entities
```

- **Imported, never copied.** `external/cnpj/fields.ts` imports `requiredString` from
  `code/string/`; it does not redeclare `.trim().min(1)`. A copy diverges on its own with `tsc`
  green.
- **Primitive → primitive is fine.** When the same piece shows up in two, it moves **down** a
  level instead of being copied.
- **A primitive knowing an entity was never a primitive.** The locale does not know what a
  creator is.

## Inside a subject

- **One folder per subject, the file named after its nature** (`external/locale/enum.ts`): the
  rule and its cost are in `../../AGENTS.md`, Naming.
- **What a piece returns decides its folder**, not what it receives or uses. A function that takes
  two instants and returns a number of days belongs to `date/`, not to a `number/`.
- **A time zone is a reading, not a concept: it goes in the name, never in a folder**
  (`daysBetweenInSaoPaulo`, not `sao-paulo/days-between`).
- **A folder is born when a piece returns that concept**, not when the concept can be mentioned.
  A sibling project created `hour/` and `second/` folders with aliases (`HourOfDay = number`) and
  removed them: a type alias of a native type vanishes at compile time and guarantees nothing.
- **No empty `formatters.ts` / `validator.ts`** in every folder. A file is born with its first
  piece.

## Before naming a piece of `code/`

1. **Does it need to exist?** If the native expression says the same thing, a name does not save
   it: a well-named `reduce` was still removed from a sibling project.
2. **List what it accepts and rejects first**, then name it after that domain.
3. **Named arguments when two have the same type**: `daysBetweenInSaoPaulo({ from, to })`. The
   positional form compiles with the ends swapped and returns the sign inverted.
4. **One function per output** rather than a flag, when picking wrong changes what the screen
   shows (`formatDate` / `formatDateTime`, not `format(value, { withTime })`).

## Traps measured in sibling projects

Registration deadlines are dates in Brazil, so `date/` will meet these:

- **Fix `timeZone: 'America/Sao_Paulo'`** when reading a deadline; tests should run in a zone that
  is neither UTC nor São Paulo, so both "forgot the zone" and "assumed the host" fail.
- `hour12: false` returns `24` for midnight in some engines; use `hourCycle: 'h23'`.
- The locale picks the calendar and digits: pin `calendar: 'gregory'` and
  `numberingSystem: 'latn'` when reading date parts.
- Building an `Intl.DateTimeFormat` costs far more than formatting: build it once per zone, at
  module load.
- A query schema the web types with `z.input` cannot use `z.preprocess`: it erases the input type
  to `unknown`.
- `Object.fromEntries(searchParams)` keeps only the last value of a repeated param
  (`?state=CE&state=PE` → `PE`).
