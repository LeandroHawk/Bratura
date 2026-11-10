# features — one folder per screen, laid out like the page

Everything the web app shows lives here; `src/app/` only routes to it. A feature is laid out by
its **page's anatomy**, not by file type: opening a folder answers "which piece of the page is
this, where does its data come from".

```
features/
  common/                      used by several features, or by app/
    components/                layout/ (SiteDocument, PageShell, SiteHeader, SiteFooter,
                               LanguageSwitch), share-art/ (OG card, icons), InlineScript,
                               NewTabHint, PageIntro (logo + h1 + lead + actions)
    config/                    site.ts (URL, title, description, tagline, team),
                               site-metadata.ts
    styles/                    globals.css
    utils/                     locale paths and params, load-google-font
  landing/  not-found/  styleguide/
```

## The anatomy of a feature

```
<feature>/
  data/                        server data several sections read            (born with Convex)
  pages/
    <Name>.page.tsx            the page: takes the locale, fits the sections
    layouts/                   one per breakpoint frame, when there is more than one
    sections/<section>/        one folder per visual region of the page
      <Section>.tsx  content.ts  use<Section>.ts  <thing>.mapper.ts
    sections/common/           shared by the sections of this page
  links/                       where the screen leads                       (born when needed)
```

The landing today:

```
landing/pages/              Landing.page.tsx fits the sections, in page order
  sections/hero/            the promise and an example call
  sections/how-it-works/    the product flow as four museum rooms
  sections/why-it-matters/  the problem, as a call's ticket without and with Bratura
  sections/business-model/  who uses and who pays, as a theatre: stage, curtains, audience
  sections/future-plans/    other ways to visit, as a floor plan: two entrances, one building
  sections/common/          what two sections share: section frames and ids, the wall label
```

A section holds everything of its region, flat; the file name says the kind. Kind subfolders
appear only past ~8 files or 3 of one kind. A team that split one screen by file type
(`components/`, `hooks/`, `mappers/`, `services/`) found its status filter spread over 3 folders
and its result list over 4; this layout is the fix they measured.

## Rules

1. **A section never imports another section.** What two share goes up to `sections/common/`
   (`WallLabel`) or through the page. An in-page anchor is not an import, and its id comes from
   `sections/common/sectionIds.ts`, so renaming a section cannot break a link to it.
2. **`common/` is common at the level of its folder**: `sections/common/` for one page's
   sections, `features/common/` for features. A piece starts with its only consumer and moves up
   when a second appears: `NewTabHint` moved to `features/common/` when the footer joined the hero.
3. **Data only one section uses stays in that section**; `data/` is for what several read.
4. **`data/` is the server boundary; a hook of behavior is not data.** `data/` holds the Convex
   queries and mutations a feature calls and the helpers of that data. A hook that only drives
   the UI (a dialog open, a filter's draft) lives in the section that uses it, or in a
   `common/hooks/` when several do. Hooks receive data already parsed: the boundary parses.
5. **Kind folders (`components/`, `config/`, `styles/`, `utils/`, `hooks/`, `data/`) are born with
   their first file**, at the level that needs them. `common/` has no `hooks/` or `data/` yet.
6. **`features/common` never imports a feature.** The tagline is in `config/site.ts` because both
   the landing and the share card show it; the card cannot reach into `landing/`.

## Copy and languages

- **Copy lives next to its component, in `content.ts`**, one per section. The pt-BR object is
  written first and is the shape; the export is `Record<Locale, typeof ptBR>`, so a key missing
  or extra in English breaks `tsc`:

  ```ts
  const ptBR = { title: 'Do acervo à inscrição, em quatro salas', room: 'Sala', rooms: [...] };
  export const HOW_IT_WORKS_CONTENT: Record<Locale, typeof ptBR> = { 'pt-BR': ptBR, en: {...} };
  ```

- **Every component takes `locale`** from its page; the page gets it from the route.
- **Both languages land in the same change.** No i18n library.
- **Copy shared by features goes to `common/`** with the component that renders it
  (`NewTabHint`) or to `config/site.ts` when it is site identity (`TAGLINE`, `SITE_DESCRIPTION`).
- **Team-only pages may be one language** (`styleguide`), and say so where they are routed.

## Layout

- **Pages render inside `PageShell`** (header, main, footer; at least one screen tall, so a short
  page keeps the footer at the bottom). The header reserves the height the sign and the cord hang
  into: a page never adds top padding for them.
  A page outside it (`/design`) gives its `<main>` `MAIN_CONTENT_ID`, where the skip link lands.
- **The look follows the house**: no small uppercase kicker above a section title; a new section
  reuses the page's grid and rhythm (heading left, content right, items split by a hairline)
  before inventing cards.
- **Check at 390px, 768px and desktop, in both themes**, before calling a screen done.

## Names

`<Name>.page.tsx` for pages, PascalCase component files, kebab-case folders, `content.ts` for
copy, `*.mapper.ts` for converters named `<output>From<input>` (`siteMetadataFromLocale`,
`localizedPathFromLocale`). Constants of copy are `UPPER_SNAKE` (`HERO_CONTENT`).
