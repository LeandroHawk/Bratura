# WhatsApp (Nvoip)

WhatsApp is **the second front** of Bratura: a second way into the same backend, not a separate
service. Messages go out through **Nvoip** (team decision, 2026-11-12), which sends through the
official WhatsApp API with approved templates. Ports and shapes: `docs/contracts.md` §2; opt-in,
abuse and prompt injection: `docs/security.md`.

## Scope

For someone already signed up, with a portfolio:

1. **Alerts** (templates): a new eligible call, a gap that blocks one, a deadline coming, a call
   amended.
2. **"Meus editais"** by WhatsApp: see eligible calls and what is missing, with links to the site.
   Needs inbound messages (open point 1 below).

Sign-up and building the portfolio by WhatsApp: later. SMS, voice calls and IVR: phase 2.

## Nvoip API (v3)

From Nvoip's official SDKs and n8n node (`github.com/Nvoip`), checked 2026-11-12:

- Base URL `https://api.nvoip.com.br/v3`. Token from `POST https://api.nvoip.com.br/auth/oauth2/token`
  with `grant_type=client_credentials` and the Client ID and Secret as `Authorization: Basic`; sent
  as `Authorization: Bearer`. **The old v2 user token and `napikey` do not authenticate v3**, so
  the v2 endpoints in older notes (`/oauth/token`, `/wa/sendTemplates`) need checking against v3,
  and the v2 credentials (`user-token`, `numbersip`, `napikey`) give way to the Client ID and
  Secret, in Convex environment variables only. Whether v3 still needs the WhatsApp `instance` id
  per send: to check.
- WhatsApp: **list templates** and **send a template**. A recipient is a phone number (or a
  BSUID), never an @username.
- No webhook for **inbound** messages appears in the SDKs.
- From the v2 docs (team analysis, to recheck on v3): a template send can hand the creator to a
  Nvoip **conversation flow** afterwards (`functions.to_flow`), which may be how replies work if
  there is no inbound webhook; **OTP** by SMS, voice or e-mail (`/otp`, `/check/otp`) and **2FA**,
  usable to verify the phone on sign-up; **balance and rates** (`/balance`, `/list/rates`) to watch
  the cost per message; SMS, voice messages and IVR (phase 2).

The v2 map from the team's analysis (`https://api.nvoip.com.br/v2/`), the starting point to find
each one in v3:

| v2 endpoint | What it does |
| --- | --- |
| `POST /oauth/token` | token valid about 24 h, with refresh |
| `GET /wa/listTemplates` | approved templates |
| `POST /wa/sendTemplates` | send a template: `idTemplate`, `destination`, `instance`, `language: "pt_BR"`; `functions.to_flow: true` hands over to a flow |
| `POST /otp`, `GET /check/otp` | one-time code by SMS, voice or e-mail, and its check |
| `POST /2fa`, `GET /check/2fa` | the same with e-mail + phone |
| `POST /sms` | SMS, no accents, up to 160 characters |
| `POST /torpedo/voice`, `/sched/torpedo` | voice message, can be scheduled |
| `/ura/list` | IVR |
| `GET /balance`, `GET /list/rates` | balance and rates |

## How it fits the backend

```
crons.ts ──► alerts/ ──► channel adapter ──► e-mail: Resend
                                         └─► WhatsApp: Nvoip (fetch, token in Convex env)
http.ts ◄── Nvoip (if it forwards inbound messages) ──► local Zod parse ──► same queries as the site
```

- **The bot reads, never computes**: it answers from `matches` and `applicationKits`, like the site,
  so both channels say the same thing.
- **A channel adapter in `alerts/`**, like the LLM adapter in `llm/`: Nvoip can be swapped for the
  WhatsApp Cloud API without touching the rest.
- **Nvoip's payload is parsed at the edge** with a local Zod schema in the module that reads it; it
  is not a DTO and not in `shared`.
- **Language**: the creator's `LocaleEnum` (`pt-BR`, `en`) becomes Nvoip's template language
  (`pt_BR`, `en_US`) through `templateLanguageFromLocale`.
- **Creator fields** this needs: `phone`, `phoneVerifiedAt`, `whatsappOptInAt`, the preferred
  alert channel (and the locale, which exists).
- **Phone verification** by Nvoip's OTP is an option; the login stays WorkOS unless the team
  decides otherwise (a verified phone as the identity, without a password, is a product idea for
  Atilio's list).
- Every message with an amount, deadline or requirement carries the official source link.

## Templates (pt_BR and en_US)

| Template | Trigger | Example |
| --- | --- | --- |
| `edital_compativel` | matching finds an eligible call | "Dona Maria, abriu o Edital X (até R$ 5.000). Você é elegível. Ver: {link}" |
| `quase_elegivel` | one fixable gap | "Falta só o CCMEI para o Edital X. Veja como tirar: {link}" |
| `prazo_chegando` | cron, 7/3/1 days | "Faltam 3 dias para o Edital X (fecha 20/11). Seu kit está pronto: {link}" |
| `edital_retificado` | Firecrawl change tracking | "O Edital X mudou o prazo para 30/11. Fonte: {link}" |

Meta approves templates, which takes time: submit them early. In the demo, use team members' numbers
only; Dona Maria stays fictional.

## Why WhatsApp (for the pitch and the product)

1. **It reaches the creator where they already are.** Artisans and artists outside big centres use
   WhatsApp every day and do not always open e-mail; the alert attacks the core problem: missed
   deadlines.
2. **No app, no password**: the link in the message opens the call's page on the site.
3. **One state across channels**: the alert on WhatsApp, "what is missing" on the site, back to
   WhatsApp; both read the same `matches`.
4. **Less text, more action**: a short message with a status (eligible, almost, not) and a link,
   instead of a legal PDF; the detail stays on the site with its source.
5. **Beyond the screen** (phase 2): a voice message reads the deadline for someone who finds reading
   hard, in line with the "Ouvir" plan; SMS for someone without mobile data.
6. **Value for who pays**: organizations can see who received and read an alert, which supports the
   panel's sales argument; Nvoip's omnichannel inbox could centralize their support (phase 2).
7. **Trust**: every message carries the official source, always from the same official number.

## Order

1. Phone verification and WhatsApp opt-in on the site.
2. `prazo_chegando` from the cron: this alone keeps the promise of room 4.
3. `edital_compativel` / `quase_elegivel` after matching.
4. Inbound "meus editais", if Nvoip forwards messages.

## Open for brainstorming (owner: the WhatsApp team)

Questions for Nvoip:

1. **Inbound**: can Nvoip forward received messages to our URL (a Convex HTTP action), or do replies
   live only inside their flows? Without it, WhatsApp is an alert channel, not a second front.
2. Are webhook calls signed, and how do we verify them? (`docs/security.md` §2)
3. Free text and media inside the 24 h window, besides templates?
4. Price per template category (utility, marketing) and how long Meta's approval takes.
