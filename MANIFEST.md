# Manifesto

**[Product name — working name: Bratura]** · Hack Brasil 2026 · Track: **Cultura & economia criativa**

> Monte seu portfólio uma vez. A gente encontra as oportunidades, diz o que falta e prepara sua inscrição.

## What this is

A copilot for Brazilian creators — artisans, musicians, artists and cultural micro-entrepreneurs —
who cannot afford a producer or project consultant. The creator builds a portfolio once; we find the
public calls (editais), festivals and fairs that fit them, explain each one in plain language, show what
is missing, and prepare the application.

The money for culture already exists. This project is about making it reach the people who create.

## Team and authorship

| Name | GitHub | Role |
|---|---|---|
| [Member 1] | [@handle] | [e.g. ingestion and data] |
| [Member 2] | [@handle] | [e.g. portfolio and matching] |
| [Member 3] | [@handle] | [e.g. web and design] |
| [Member 4] | [@handle] | [e.g. product, pitch and video] |

The intellectual property of this project belongs entirely to the team above (regulation item 11.1).
The team warrants that the project does not infringe third-party rights (11.3).

## Originality

- This repository was created **after the opening session of Hack Brasil 2026 (04/11/2026, 21:00)** and
  contains **no code or history imported from before the event** (items 6.1 and 6.2).
- Third-party libraries, frameworks and APIs are used under their own licences (item 6.5). They are
  listed in the package manifests.

## Use of AI

AI tools are allowed and recommended by the regulation (item 6.4). We used:

- **[AI coding assistants used by the team, e.g. Claude, Devin]** for research, planning and pair programming.
- **[LLM provider]** inside the product, to read public calls, organize portfolios and suggest texts.

Inside the product, the AI never invents facts about a call: every value, deadline or requirement shown
comes from the official source, with a link. When a field is not in the source, the app says so.

## Data and privacy

- We only collect from **open sources that allow it**, respecting robots.txt and terms of use:
  Mapas Culturais public APIs (federal, Ceará, Pernambuco, Santo André) and official government pages.
- We deliberately **do not** collect from platforms whose terms forbid it (e.g. Prosas, social networks).
- Creators' portfolios are provided by the creators themselves, with consent, and are never sold.
- The demo uses a **fictional creator** and does not expose real personal data of third parties
  (item 6.9). We follow Brazil's LGPD.

## Licence

[MIT](LICENSE). Anyone, including the jury, can read, run and test this code (item 6.6).

## Availability

- This repository stays public until at least **15/12/2026** (item 6.7).
- Demo: [https://…] — online throughout judging (item 7.3).
- Video (≤ 3 min, no login): [https://…]

## Repository map

```
apps/web            Next.js app (Vercel)
apps/crawler        reserved for a future crawler (empty)
packages/backend    Convex backend: ingestion, portfolio, matching, alerts, WhatsApp webhook
packages/shared     shared types, zod schemas, prompts
```

## Run locally

```
pnpm install
pnpm dlx convex dev        # in packages/backend, creates a dev deployment
pnpm dev                   # starts web + backend through Turborepo
```

Required environment variables are listed in `.env.example` (never commit real keys).
