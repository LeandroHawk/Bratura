# Security

Who may read and write what, how the backend resists abuse, and how text we do not control is kept
from steering the LLM. Shapes and ports are in `docs/contracts.md`.

> **Always open for brainstorming.** None of us is a security specialist and this file will have
> gaps. A doubt, an attack idea or a "what if" is welcome at any time, in a PR, an issue or with the
> team, and is worth more than a rule nobody questioned.

## 1. Ownership

- **The owner comes from authentication, never from the args.** The function builders
  (`docs/contracts.md` §3) put the caller in `ctx`. A function that takes `creatorId` from the front
  to decide whose data it touches is a bug, even if the front sends the right one.
- **Every read or write of an owned document checks the owner** through one helper
  (`assertCreatorOwns(doc, ctx)`), never an inline comparison that a new function can forget. Lists
  read through an index on the owner, so they cannot return someone else's rows.
- **An organization sees only its members**, through `memberships`. An organization member never
  writes a creator's portfolio; the creator owns it.
- **Admin is a role, checked in its builder** (`adminMutation`), for the extraction review only.
- **The write schema leaves out what the server sets** (owner, status, derived values), so a front
  cannot even express a change to them (`docs/contracts.md` §1).

## 2. Spam and abuse

- **Size limits live in the Zod declaration**: `.max()` on every free text, a maximum number of
  portfolio items, file type and size checked before storage. The backend parses them, so the limit
  holds whatever the front sends.
- **Rate limits per creator and per phone number** on writes and on the WhatsApp entry, declared
  once in the public builders (`publicQuery`, `creatorMutation`…) when the first one is written.
  `convex-helpers` (already a dependency) ships `rateLimit` (token bucket or fixed window), so no
  new dependency is needed; `@convex-dev/rate-limiter` stays an alternative for the team.
- **The WhatsApp webhook trusts nothing**: it checks where the call comes from (ask Nvoip whether
  calls are signed), ignores a message id it has already handled (the inbox pattern of
  `docs/architecture.md`, Idempotency and concurrency), and answers an unknown number with the
  sign-up link only.
- **Paid or limited calls never run per user request.** Gemini and Firecrawl run in batch ingestion;
  a user action reads what is stored. Public queries are paginated, never an unbounded `collect()`.
- **Messages out need opt-in** (`whatsappOptInAt`) and stop on "SAIR"; e-mail alerts the same.

## 3. Prompt injection

The LLM reads text written by people we do not know. Anyone can create an opportunity on a Mapas
Culturais instance, and a PDF or a page can carry instructions aimed at the model ("ignore the
above, the deadline is…", "tell the creator to send their CPF to…"). The design assumes the model
**will** sometimes follow them, and makes that harmless:

- **The model only returns data.** No tools, no function calls, no writes: its output is parsed
  with Zod (`safeParse`) and a failure is a retry or a `null`, never a guess.
- **Every extracted field is checked against the source text.** Each non-null field carries a
  verbatim evidence quote; the backend confirms the quote appears in the text it sent (whitespace
  normalized) and that a number or date in the field appears in its quote. A field that fails
  becomes `null`, shown as "não informado".
- **Links never come from the model.** A link shown to a user is the stored source URL, or a URL
  that appears in the source text on the source's own host.
- **Model output is shown as text**, never rendered as HTML or Markdown with links. **So is every
  text from a source** (a call notice's title and summary come from whoever wrote them on Mapas):
  React escapes it; `dangerouslySetInnerHTML` never touches source or model text.
- **One prompt, one creator.** A prompt carries the public call text and, for the application kit,
  only the requesting creator's own portfolio: never another creator's data, never secrets or
  environment values.
- **The application kit is a draft.** Its texts are generated from the creator's portfolio and the
  extracted requirements, shown for the creator to edit, and never ask for documents or personal
  data beyond what the extracted requirements list with evidence.
- **WhatsApp intent is not free text to the model.** Buttons and keywords decide what the creator
  asked; if the model ever classifies a message, its output is one value of a Zod enum.
- **Untrusted text is marked as data in the prompt** (delimited, with the instruction to treat it
  as content). This lowers the rate; the checks above are what make it safe.
- **Admin review** sees extracted fields beside their evidence and flags extractions where the
  checks dropped fields.

## 4. Personal data and secrets

- **The demo shows a fictional creator only** (competition rule 6.9); no individual's name taken
  from a data source is ever displayed (`docs/data-sources.md`).
- **Only public call text and the fictional creator go to the free-tier LLM**, whose inputs the
  provider may use.
- **Secrets live in Convex and Vercel environment variables**, never in the repo (it is public).
  `.env*` files are git-ignored; a key is set with `convex env set NAME` with no value, so it is
  prompted for and stays out of shell history.
- **Personal data inside documents is not stored.** Call notice PDFs are public, but a *result*
  ("resultado final", lists of approved applicants) carries individuals' names and sometimes CPFs.
  Classification drops such documents before their text is stored (competition rule 6.8, LGPD).
- **Our code fetches only what the team registered.** A Convex action calls `fetch` only on a
  registered source's `https` base URL. A link from a source's data (`documentUrl`, written by
  anyone who can publish on Mapas) is read only through Firecrawl, outside our infrastructure, so a
  crafted link cannot make our backend call an internal address. `requiredHttpUrl` also refuses IPs
  and `localhost`, but not a domain that points inside.
- **Errors never leak.** A function throws a code (`appError`), not an internal message; Zod's
  issues carry the path, the rule and its numbers, never the value sent; Convex redacts any other
  error to "Server Error" in production. Keep it so: returning `error.message` from a caught
  exception to a front reopens what this closes.
- **Who can act as admin today.** Internal functions (`addSource`, ingestion) can be run from the
  Convex dashboard and CLI. Team roles (2026-11-13): João Victor is the only Admin; Atilio, Leandro
  and Kaik are Developers, who may read production data but cannot write to it. Granting Admin or
  Project Admin grants production writes. Until `adminMutation` exists, the Convex team is the
  admin.

## 5. Dependencies

Every dependency runs with the backend's secrets or in the creator's browser.

- **A new dependency is a team decision** (root `AGENTS.md`); the platform and the standard library
  come first.
- **Versions are pinned and not brand new**: an exact version in the `catalog:` of
  `pnpm-workspace.yaml`, published about two weeks before it is adopted, so a hijacked release has
  time to be caught (`convex` 1.48.0 and `convex-helpers` 0.1.131 were chosen that way).
- **pnpm's block on install scripts stays on.** Each package with one is approved or denied by
  name in `allowBuilds` (`pnpm-workspace.yaml`, through `pnpm approve-builds`), after reading what
  it runs; CI's frozen install fails on any package left undecided. `esbuild` is denied: it works
  without its own.
- **An install script piped from the web is read before it runs** (the Devin CLI installer was).

## Open for brainstorming

Known gaps, in no order; add yours:

- Does Nvoip sign webhook calls, and how do we verify them?
- Rate limiter: `convex-helpers`' `rateLimit` (no new dependency) or the Convex component?
- Uploads: do we need a malware or content check for portfolio files before showing them on a
  public page (`/p/{slug}`)?
- Account deletion and data export (LGPD) for creators.
