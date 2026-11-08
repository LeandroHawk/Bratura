# app — Next.js file conventions only

`app/` is the router: it decides which feature page answers a URL and exports what Next reads from
special files. Markup, copy and logic live in `src/features/` (see its `AGENTS.md`). This Next
version differs from most training data: read `node_modules/next/dist/docs/` before using an API.

```
app/
  [lang]/                    the root layout's segment: pt-BR (served at /) or en (/en)
    layout.tsx               <SiteDocument>, site metadata, static params, viewport
    page.tsx                 → features/landing
    design/page.tsx          → features/styleguide (pt-BR only; /en/design is a 404)
    opengraph-image.tsx      → share-art/share-card (one card per locale)
    not-found.tsx            → features/not-found, locale from next/root-params
    [...missing]/page.tsx    any unknown path under a locale: calls notFound()
  global-not-found.tsx       URLs no route matches; renders outside [lang]
  icon.tsx  apple-icon.tsx   → share-art/brand-icon (one drawing, two sizes)
  manifest.ts  robots.ts  sitemap.ts
```

## A file here is a few lines

A route file parses what the URL gives it and hands over to a feature:

```tsx
// [lang]/page.tsx
export default async function Page({ params }: PageProps<'/[lang]'>) {
  return <LandingPage locale={await localeFromParams(params)} />;
}
```

A metadata image exports only what Next reads (`size`, `contentType`, `generateImageMetadata`) and
calls a function from a feature (`shareCardImageFromLocale`, `brandIconImageFromSize`). Copy comes
from the feature's `content.ts` or `features/common/config/site.ts`, never a literal here.

## Why the root is crowded, and must stay so

- **`robots.ts`, `sitemap.ts`, `manifest.ts`, `icon.tsx`, `apple-icon.tsx` and
  `global-not-found.tsx` must sit at the root of `app/`.** Moving them into a route group was
  tested (2026-11-08): `robots.txt` and the manifest vanished from the build and the pages lost
  their `<link rel="icon">`. They cannot get a semantic folder; their contents are kept thin
  instead.
- **The icons are locale-free routes** (`/icon`, `/apple-icon`), so `src/proxy.ts` excludes them
  from the locale rewrite. A new root route without a file extension needs the same exclusion, or
  the proxy sends it to `/pt-BR/...` and it 404s.

## Locale and routing

- **The default locale has no prefix.** `src/proxy.ts` rewrites `/x` to `/pt-BR/x`; `/en/x` passes
  through. Public URLs and links already shared do not change.
- **`[lang]` is parsed, never trusted**: `localeFromParams` (`features/common/utils/`) runs
  `LocaleEnum.safeParse` and 404s anything else. `dynamicParams = false` plus
  `generateStaticParams` prerender every locale.
- **Files that get no params** (`not-found.tsx`) read the segment with `localeFromRootParams`.
- **A page declares its alternates** (`languageAlternatesFromPath`) so each language links the
  other with `hreflang`; a one-language page sets `alternates.languages: {}`.

## 404s

- `[lang]/[...missing]` turns every unknown path into `notFound()` inside the locale layout, so the
  404 has the header, the footer and the right language.
- **`global-not-found.tsx` and the `experimental.globalNotFound` flag are required**, not leftovers.
  With the root layout under `[lang]`, every 404 in `next dev` bumped the HMR version and the page
  reloaded itself forever ("HMR hash mismatch"); production was fine, which is why it looked
  dev-only.
- A nested not-found ignores `metadata`, so `NotFoundPage` sets its `<title>` itself.

## Traps

- **Scripts in the root layout**: render inline scripts through `InlineScript` (a client
  component). A plain `<script>` warns on every client navigation between `/` and `/en`.
- **`generateImageMetadata` gets plain `params`, and gets `{}`** while Next lists the image ids at
  build time: it must work without `lang`.
- **Moving `globals.css`** changes the base of its `@source` path; Tailwind then silently drops the
  design system's classes and the page loses its layout.
