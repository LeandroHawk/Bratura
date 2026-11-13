# AGENTS.md — Bratura

Rules for anyone (human or agent) changing this repo. Short on purpose: the reasoning and examples
live next to the code they govern (table below).

Product, data sources and plan: `README.md`. Authorship and use of AI: `MANIFEST.md`.

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
| `docs/review.md`             | reviewing any change: owners to open, four lenses, repo checks     |

The rules that hold everywhere:

- **Three levels of shared, by who uses it today:** web and backend → `packages/shared`; several
  features of one app → `features/common/`; one feature → inside it.
- **One shape, one Zod:** grep before declaring; derive with `.pick`/`.omit`/`.extend`, never
  retype a field list; parse with Zod wherever data passes through `any` (network, LLM, scraping,
  URL, storage).
- **The backend computes, the web displays**, and nothing shown to a user is invented: every
  value has a source link or reads "não informado".

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

- Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`), one concern per PR,
  PRs into `dev`.
- Never commit secrets; `.env*` stays local.
