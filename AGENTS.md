# AGENTS.md — Bratura

Rules for anyone (human or agent) changing this repo. Short on purpose: the reasoning and examples
live next to the code they govern (table below).

Product: `README.md`. Plan to 30/11: `docs/plan.md`. Data sources: `docs/data-sources.md`.
Authorship and use of AI: `MANIFEST.md`.

## Commands

Node 22 (`.node-version`), pnpm (version pinned in `package.json`).

```bash
pnpm install
pnpm dev            # web app on :3000
pnpm check          # lint + typecheck + test + build, every workspace (what CI runs)
pnpm format         # prettier
```

`apps/web/AGENTS.md` is written by `next dev`: read it before touching Next.js APIs (this Next
version differs from most training data; its docs ship in `node_modules/next/dist/docs/`).

## Where the rules live

Each main folder has an `AGENTS.md` with its rules and examples (and a `CLAUDE.md` that imports
it). **Read the one for the folder you are about to change before creating a file there.**

| folder                       | what its `AGENTS.md` covers                                        |
| ---------------------------- | ------------------------------------------------------------------ |
| `packages/shared/`           | the contract: entity or primitive, fields, fragments, one Zod      |
| `packages/shared/src/primitives/` | `code/`, `domain/`, `external/`, naming, measured traps       |
| `packages/ui/`               | tokens, themes, components without product copy                   |
| `apps/web/src/app/`          | routing only: thin files, locale rewrite, 404s, root-file limits   |
| `apps/web/src/features/`     | page anatomy, sections, `common/` levels, copy per locale          |
| `docs/architecture.md`       | the map, the backend (Convex, Firecrawl, LLM), cross-folder rules  |
| `docs/contracts.md`          | ports, DTO folders, the row the front sends, function builders, writers and readers |
| `docs/security.md`           | ownership, spam and abuse, prompt injection, personal data         |
| `docs/data-sources.md`       | allowed and excluded sources, the Mapas API                        |
| `docs/integrations/`         | Firecrawl, WhatsApp (Nvoip)                                        |
| `docs/plan.md`               | until 30/11: product, competition rules, tools, dates              |
| `docs/product.md`            | the idea, track fit, competitors, who pays, phases (owner: the PO) |
| `docs/review.md`             | reviewing any change: owners to open, four lenses, repo checks     |

**Every one of these is open for brainstorming**, security above all: question a rule in the PR or
with the team instead of working around it.

The rules that hold everywhere:

- **Three levels of shared, by who uses it today:** web and backend → `packages/shared`; several
  features of one app → `features/common/`; one feature → inside it.
- **One shape, one Zod:** grep before declaring; derive with `.pick`/`.omit`/`.extend`, never
  retype a field list; parse with Zod wherever data passes through `any` (network, LLM, scraping,
  URL, storage).
- **The backend computes, the web displays**, and nothing shown to a user is invented: every
  value has a source link or reads "não informado".

## Known traps

- **TypeScript stays on `~6.0`** (catalog): `typescript-eslint` peers `typescript <6.1`, so 7 breaks
  the lint.
- **`apps/web` typecheck depends on build** (`apps/web/turbo.json`): `next typegen` and `next build`
  both write `.next/types` and raced in CI. Keep the dependency if tasks are reshuffled.
- **The React compiler lint** rejects `setState` called synchronously in an effect and assignments to
  `element.dataset.x`: drive DOM-only state with `setAttribute('data-…')` and style it with
  `group-data-[…]:` variants.
- **A Vercel branch preview URL cannot be derived** (over 63 characters, it does not resolve): take
  it from the Vercel bot's comment on the PR.
- **Lighthouse's simulated mobile LCP is not evidence** (it moved 2.1 s → 2.7 s with identical
  requests): compare with `--throttling-method=devtools`.

## Code conventions

- **Language:** code, comments and docs in English; UI copy in pt-BR and en, both in the same
  change.
- **Comments say what the thing does and what breaks without it**, never the session's
  reasoning. Over 3 lines is a smell. A guarantee is a type or a test, not prose.
- **Names are declarative and long**: the concept, not the mechanics (`docs/architecture.md`
  §5). Unsure → propose options and ask.
- **No barrels inside a package**; import from the source file. Across packages, go through the
  package's `exports`.
- **Import paths**: `./` only for the same folder; anything else in an app through `@/`
  (`@/features/common/utils/locale-path`), never `../`; another workspace through
  `@bratura/<package>/...`. **Inside `packages/` imports stay relative**: a package is compiled by the
  app that imports it, so an `@/` there would resolve against the app's `src/`. Lint enforces the
  app side.
- **No new dependency without asking the team.** Native API or standard library first. A version
  used by several workspaces is declared once, in the `catalog:` of `pnpm-workspace.yaml`, and the
  `package.json` says `catalog:`.
- **Accessibility is not optional:** real links and buttons, `lang` set, axe clean on every page.

## Git

- **Branch `<type>/<slug>` from `dev`**, where `<type>` is the commit type: `feat/`, `fix/`,
  `refactor/`, `docs/`, `chore/`, `test/` (`feat/whatsapp-alerts`, `docs/split-architecture-docs`).
- **Conventional commits** with the workspace as scope when there is one: `feat(web): …`,
  `fix(shared): …`, `docs: …`. The subject says what changes, lowercase, no final period.
- **One concern per PR, into `dev`.** Review it with `docs/review.md` before opening.
- **The PR title is its main commit**; the body opens with one or two sentences on what changes and
  why, then one bullet per change with a bold lead-in, then what was checked and what the reviewer
  should check (both locales and both themes for anything visible).
- **Releases: a PR `dev` → `main`**, titled `release: <what changes for the visitor>`, body
  "Brings `dev` to production. Merge with a merge commit.", the list of PRs it carries and what to
  check after the deploy. **Merge commit only**: a squash puts on `main` a commit `dev` lacks, and
  the next release conflicts. Into `dev`, any merge method.
- **Code copied from a public starter kit or example names its origin in the commit message**
  (competition rule 6.2); code from before 04/11/2026 that was never public never enters.
- **People merge, agents don't.** Delete the branch after the merge; a PR stacked on it is
  retargeted first (deleting its base closes it).
- Never commit secrets; `.env*` stays local.
