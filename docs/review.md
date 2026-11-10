# Reviewing a change

For any change: feature, fix, refactor, copy. The diff shows what changed, not what already existed
beside it, so every lens runs against the repo, not only against the changed lines.

## 1. Open the owners before judging

For each folder the diff touches, read its `AGENTS.md` (the table in the root `AGENTS.md`). Then
the files that own what a change is tempted to redo:

| owner                                   | answers                                                   |
| --------------------------------------- | --------------------------------------------------------- |
| `packages/ui/src/index.ts`              | which components, hooks and utils the design system has   |
| `packages/ui/src/tokens/tokens.css`     | every colour token; `@theme inline` makes each a class    |
| `apps/web/src/features/common/`         | shared web components, `config/site.ts` (site-wide copy)  |
| `sections/common/` of the page          | pieces shared by that page's sections                     |
| `packages/shared` exports               | every shape and its Zod (one shape, one Zod)              |

## 2. The four lenses

1. **Belongs elsewhere.** Each new symbol sits with its owner: a type next to the data it
   describes, copy in `content.ts`, visual primitives in the design system (which holds no product
   copy), a piece with a second consumer one level up (`features/AGENTS.md`, rule 2).
2. **Already exists.** Before accepting a helper, constant, style or component, look for it: design
   system exports, Tailwind (built-in utilities and the `@theme` tokens), `features/common`,
   `packages/shared`, the platform. A new dependency needs the team.
3. **Generalizable.** The same pattern in two places becomes one piece (component, token,
   constant). Not when it saves one line and adds an indirection.
4. **Derivable.** Two values that must agree (props, constants, a doc restating code), meaning taken
   from position or order, a list written by hand that the code or the file system already knows.

## 3. Repo checks

Each search runs over the folders as written (`rg` drops `-g` filters for files passed one by one);
a hit in a changed file is a question, not a verdict.

```sh
# token by hand: use its class (gradients, multi-part shadows, stop-color excepted)
rg -n 'var\(--bt-|\(--bt-' apps/web/src

# literal colour: needs a token (known and kept: the sign's light and shade in hanging-sign.css,
# the mask in light-switch.css)
rg -n '#[0-9a-fA-F]{3,8}\b|rgba?\(' apps/web/src packages/ui/src -g '!tokens.css' -g '!palette.ts' \
  -g '!*.test.*'

# hand-made pill: Tag (neutral) or Badge (status)
rg -n 'rounded-full border' apps/web/src

# hand-made Eyebrow
rg -n 'tracking-\[0.1em\]' apps/web/src

# a button outside Button, or a click on a non-button (not allowed; a mouse shortcut is a <button
# tabIndex={-1} aria-hidden> beside a real one)
rg -n '<button|onClick' apps/web/src

# the design system has prefersReducedMotion and the theme helpers
rg -n 'matchMedia|localStorage' apps/web/src

# focus made invisible: fails eMAG 4.4 (ASES); focus-ring is the visible focus, and a skip-link
# target needs neither tabIndex nor outline-none
rg -n 'outline-none|outline-hidden|outline: *(none|0)' apps/web/src packages/ui/src
```

Also: doc comments over 3 lines or telling the session's story (root `AGENTS.md`); new public
names declarative, `<output>From<input>`, proposed and asked; every decorative `<svg>` carries
`aria-hidden` itself (WAVE flags one that only sits inside an `aria-hidden` parent).

And for anything the visitor sees: copy in pt-BR and en in the same change, nothing invented (a
source or "não informado"), axe clean on every touched page in both themes (and WAVE on production
after the deploy), screenshots at phone, tablet and desktop widths in both themes. For the Brazilian
government's eMAG (checked by ASES): adjacent links go in a list, `SiteDocument` keeps the "skip to
content" link as every page's first stop, words in another language carry `lang` ("Design system"),
and `SiteDocument` keeps the `<noscript>` note. Known and accepted, not to fix: WAVE's contrast
errors on the logo's yellow letters in the light theme (logotype, `packages/ui/AGENTS.md`).
Then `pnpm check`.

## 4. Report

Per lens: what ran, on which files, what was fixed, what needs a decision. Names, behaviour
changes and removed copy are decisions for the person, with proposals. Never "nothing left":
after fixing, review the new diff again, because fixes bring their own repeats.
