# Telegram (Bot API)

Telegram is **the second front** of Bratura: a second way into the same backend, not a separate
service. Messages go out through a **bot** (team decision, 2026-11-17, after the WhatsApp number
was banned). Ports and shapes: `docs/contracts.md` §2; opt-in, abuse and prompt injection:
`docs/security.md`.

## Scope

For someone already signed up, with a portfolio:

1. **Alerts** (free text): a new eligible call, a gap that blocks one, a deadline coming, a call
   amended.
2. **"Meus editais"** by Telegram: see eligible calls and what is missing, with links to the site.
   Needs inbound messages (open point 1 below).

Sign-up and building the portfolio by Telegram: later.

## Bot API

From Telegram's Bot API (`core.telegram.org/bots/api`), checked 2026-11-17:

- **The bot is the account.** `@BotFather` creates it and hands one token (`<id>:<secret>`), kept
  as `TELEGRAM_BOT_TOKEN` in the deployment's environment only. There is no OAuth and no per-send
  credential: the token is the whole auth.
- Every call is `POST https://api.telegram.org/bot<token>/<method>`, JSON body, under our usual
  `AbortSignal.timeout`.
- `getMe` answers who the bot is — `telegram:checkTelegramCredentials` runs it to prove a token;
  a send run also runs it once, so a dead token stops the run before any claim.
- `sendMessage` takes `chat_id` and `text` (plain text, no `parse_mode`, so no copy can break
  markup; up to 4096 characters, far above our `long` ceiling). A 2xx wraps the result as
  `{ ok: true, result: { message_id, … } }` — the delivery stores `message_id` when present and
  counts any other 2xx as sent.
- A recipient is a **`chat_id`**, not a phone and not a `@username`: the user gets one by opening a
  chat with the bot (`/start`). Resolving it from `users` at send time keeps no chat id in the
  notification or delivery tables.
- **Opt-out is a refusal, not a keyword.** A user who blocks the bot makes every send answer
  `403` — a final refusal the outbox never retries. `/parar` stops sends through the product too
  once inbound exists; Telegram commands are lowercase words (`/parar`, not "SAIR").
- **Errors:** a non-2xx answers `{ ok: false, error_code, description }`. A 4xx is a refusal the
  same send would repeat — final. 429 (`retry_after`) and 5xx or no answer are transient and
  retry to the attempts cap. Only the failure code is stored or logged, never the `description`.
- **Free, but not unlimited**: no per-message fee; Telegram throttles a bot globally and per
  chat, so `sendCeiling` per run and `telegramDeliverySend` per recipient still brake volume.
- **Inbound**: `setWebhook` (HTTPS to `convex/http.ts`, with the `secret_token` header checked)
  receives messages — how `/start` deep links (`t.me/<bot>?start=<userId>`) will bind a chat to a
  user, and how `/parar` will arrive. Not built yet; `getUpdates` polling stays a fallback.

**Checked with real calls, 2026-11-17** (dev deployment; no token, no real chat id recorded):

- `POST /bot<token>/getMe` → `{ "ok": true, "result": { "id": <bot id>, "username": "<bot>" } }`.
- `POST /bot<token>/sendMessage` with `{ "chat_id": "<id>", "text": "<pt-BR>" }` →
  `{ "ok": true, "result": { "message_id": 2, … } }`; the delivery stored `providerMessageId: "2"`
  and `status: "sent"`, and the message reached the test chat.
- Not yet seen live: the non-2xx shape on a blocked bot (`403`, `{ ok: false, error_code,
  description }` per the docs) — treated as a final refusal until proven otherwise.
