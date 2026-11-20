# Telegram (Bot API)

The **message channel** of Bratura (WhatsApp planned, `docs/integrations/whatsapp.md` — paused):
a second way into the same backend, not a separate service. Messages go out through a **bot**
(team decision, 2026-11-17, after the WhatsApp number was banned). Ports and shapes:
`docs/contracts.md` §2; opt-in, abuse and prompt injection: `docs/security.md`.

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
  a send run also runs it once, so a dead token stops the run before any claim. A 401 mid-run
  (the token revoked under us) stops the run the same way, leaving the rest untouched.
- `sendMessage` takes `chat_id` and `text` (plain text, no `parse_mode`, so no copy can break
  markup; up to 4096 characters, far above our `long` ceiling). A 2xx wraps the result as
  `{ ok: true, result: { message_id, … } }` — the delivery stores `message_id` when present and
  counts any other 2xx as sent.
- A recipient is a **`chat_id`**, not a phone and not a `@username`: the user gets one by opening a
  chat with the bot (`/start`). It lives in `userMessageChannels` (one row per user and channel:
  destination, `optInAt`, `optOutAt`), is resolved at send time, and never lands in the
  notification or delivery tables.
- **Opt-out is a refusal, not a keyword.** A user who blocks the bot makes every send answer
  `403`: the outbox records it as `optOutAt` on the channel row and never claims that user again
  (a re-`/start` clears it). `/parar` stops sends through the product too once inbound exists;
  Telegram commands are lowercase words (`/parar`, not "SAIR").
- **Errors:** a non-2xx answers `{ ok: false, error_code, description }`. A 4xx is a refusal the
  same send would repeat — final. 429 (`retry_after`) and 5xx or no answer are transient and
  retry to the attempts cap. Only the failure code is stored or logged, never the `description`.
- **Free, but not unlimited**: no per-message fee; Telegram throttles a bot globally and per
  chat, so `sendCeiling` per run and `telegramDeliverySend` per recipient still brake volume. The
  claim only peeks at the quota (`checkRateLimit`); a confirmed send is what spends it.
- **Inbound**: `setWebhook` (HTTPS to `convex/http.ts`, with the `secret_token` header checked)
  receives messages — how `/start` deep links will bind a chat to a user, and how `/parar` will
  arrive. Not built yet; `getUpdates` polling stays a fallback.

**Binding a chat to a user** must never carry the `userId` in the open: `t.me/<bot>?start=<code>`
with a single-use random code the site hands to the signed-in creator (a row the webhook
consumes once). A `?start=<userId>` link lets anyone who learns an id receive that user's
notifications.

**Checked with real calls, 2026-11-17** (dev deployment; no token, no real chat id recorded):

- `POST /bot<token>/getMe` → `{ "ok": true, "result": { "id": <bot id>, "username": "<bot>" } }`.
- `POST /bot<token>/sendMessage` with `{ "chat_id": "<id>", "text": "<pt-BR>" }` →
  `{ "ok": true, "result": { "message_id": 2, … } }`; the delivery stored `providerMessageId: "2"`
  and `status: "sent"`, and the message reached the test chat.
- Not yet seen live: the non-2xx shape on a blocked bot (`403`, `{ ok: false, error_code,
  description }` per the docs) — treated as an opt-out until proven otherwise.

## Open for brainstorming

Known next steps, each with the trigger that makes it real; add yours:

1. **Inbound webhook** (when the bot must answer people): `setWebhook` + `secret_token`,
   `/start` binding through a single-use code (above), `/parar` writing `optOutAt`, `update_id`
   dedupe (the inbox pattern of `docs/architecture.md`, Idempotency and concurrency).
2. **A second channel** (when WhatsApp or e-mail returns): the outbox picks the channel the
   delivery row carries instead of importing `model/telegram/` directly — `userMessageChannels`
   already holds one row per user per channel, so the channel comes back as a line, not a
   migration.
3. **A scheduled sender** (when sends run by cron): a growing wait between retries (today the
   next run is the retry), and a backoff read off 429's `retry_after`.
4. **Real triggers** (when deadline and amendment crons exist): `dedupeKey` carries the close
   date (`deadlineSoon:<call>:d7:<closes>`), so a retified deadline notifies again; a notification
   past its deadline expires unclaimed.
5. **Outbox growth** (when volume matters): fewer reads per delivery (list rows, not ids), and
   the queue split `pending`/`sending` so a claim is a status flip, not a reservation.
