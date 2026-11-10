# packages/ui — the design system

`@bratura/ui`: tokens, theme, and components with no product knowledge. The web app imports it from
the package root (`import { Logo } from '@bratura/ui'`) and its stylesheet once
(`@import '@bratura/ui/styles.css'` in `features/common/styles/globals.css`). The living reference
is the `/design` route.

```
src/
  tokens/        tokens.css (primitives + semantic tokens, both themes), tokens.ts (names and
                 contrast pairs), palette.ts (resolved light values for next/og and the manifest)
  theme/         the inline theme script, useTheme, the light-switch transition
  components/<Name>/   Name.tsx, name.css, Name.test.tsx; one folder per component
  utils/         contrast ratio (used by the token tests), prefersReducedMotion
  index.ts       the package entry: every public export, nothing else
  styles.css     the stylesheet entry: imports tokens, utilities and each component's css
```

## Identity

Two themes named after a museum: **Acervo** (light, parchment, the default) and **Galeria** (dark,
walnut and brass, when someone pulls the cord). The house objects are physical: the theme is a
**light pull cord** (`PullCord`), the language a **market-stall sign** (`HangingSign`). A new
control prefers an object from that room to a generic widget; it hangs from the top edge, lit or
not by the cord's glow.

## Tokens

- **Components use semantic tokens only** (`--bt-foreground`, `--bt-wood`), never a primitive
  (`--bt-oak-500`). `tokens.test.ts` fails if a component reaches for a primitive.
- **Every semantic token exists in both themes**; the test checks the names match.
- **A new semantic token lives in four places, each tested:** both theme blocks of `tokens.css`, the
  `@theme inline` block (so it is a class: `bg-wood`, `fill-art-blue`), `COLOR_TOKENS` in
  `tokens.ts` (the `/design` page lists it), and its label in the `/design` page's `content.ts`.
- **A pair that carries text or meaning goes in `CONTRAST_PAIRS`** (`tokens.ts`) with its WCAG
  minimum (4.5 for text, 3 for edges and focus). The test runs every pair in both themes.
  Example: the sign's text on oak (`wood-ink` on `wood`, 5.4) and the board's edge on the wall.
- **An object in the room keeps its material in both themes and adapts only its edge.** The sign is
  the same oak in Acervo and Galeria; `--bt-wood-edge` and `--bt-twine` change so it stays cut out
  from the wall. The cord does the same with brass (`--bt-cord-*`).
  The stage curtain is velvet (`--bt-curtain`, `--bt-curtain-fold`), a deep crimson kept apart
  from `--bt-status-missing`: red-for-missing stays the bright red of the statuses.
  The ticket (`--bt-ticket-*`) is parchment in Acervo and a golden ticket, brass, in Galeria;
  its stamp darkens to deep velvet on gold (`--bt-velvet-800`, darker than the curtain's) so it
  keeps 4.5:1. The "application ready" stamp (`--bt-ticket-stamp-ready`) is a dark green, darker
  on gold, kept apart from the logo's green. Both stamps are in `CONTRAST_PAIRS`. The panels that
  close the stage cast `--bt-curtain-shadow`.
- **Painted things on stage use `--bt-art-*`, never the logo's tokens.** The scenery's art (a
  painting, a quilt) is a material too, the same in both themes; today it borrows the flag's colours
  and the curtain's velvet, but through its own names, so the logo can change without repainting it.
- **The word mark keeps the flag's colours in both themes.** Its letters are a logotype, exempt from
  text contrast (WCAG 1.4.3), and the dark outline sets them apart from the splat. WAVE still flags
  the yellow "r" and "u" on parchment in the light theme: known and accepted (a deep gold was tried
  on 2026-11-10 and lost the identity).
- **Light is the default.** No stylesheet switches to dark on `prefers-color-scheme` alone (tested);
  the theme script applies the saved choice before first paint.
- **Places that cannot read CSS variables** (`next/og` images, the web manifest) use
  `LIGHT_THEME_COLORS` from `palette.ts`; the test keeps it equal to `tokens.css`.

## Components

- **No product copy inside.** Text arrives as props: `PullCord` takes `copy`, `HangingSign` takes
  `front` and `back`. The web owns the words and the languages.
- **The brand name never changes**: the word mark is "Bratura" on every page. The slogan is copy
  like any other: `Logo` takes it as `slogan` (`text` + `lang`), defaulting to the Portuguese
  `SLOGAN`, and sets its `lang` from it. The web translates it per locale (`SITE_SLOGAN`).
- **`Badge` means a status, `Tag` means nothing but itself.** A status (open, closing soon, missing)
  is a `Badge`, coloured by its status token. Any other pill (a document, an included feature) is
  a `Tag`, bordered in its own text colour so it fits any surface. Neither is styled by hand.
- **A real element for the real job.** `HangingSign` is an `<a href hreflang>`; its animation never
  replaces the link (modified clicks and reduced motion follow it at once). `PullCord` is a
  `<button>` whose visible label is its accessible name, and it announces the result.
- **Motion respects `prefers-reduced-motion`**: in CSS with the media query, in code with
  `prefersReducedMotion()` (`utils/motion.ts`).
- **CSS lives next to the component** in `@layer components`, with `bt-` class names, and is
  imported from `styles.css`. Focus uses the `focus-ring` utility.
- **`'use client'` only when the component has state or handlers** (`PullCord`, `HangingSign`).
- **Tests render to static markup** (`react-dom/server`) and assert what a user or a screen reader
  gets: the role, the accessible name, the link target.

## What belongs here

A component moves into `packages/ui` when it knows nothing about the product: no copy, no data, no
routes. A composition with product text stays in the web feature (`WallLabel` in the landing reads
like a design-system piece but exists for one page's copy). Generalize at the second consumer.
