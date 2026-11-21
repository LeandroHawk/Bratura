# AbacatePay

The **billing provider** of Bratura — the first payment gateway in the project. It charges the
**organization panel** only: a monthly subscription whose quantity is the number of creators the
organization manages (the "per managed profile" price). The creator side is free and never
touches it (`docs/product.md`, Who pays). Backend only so far: no screen builds the checkout, the
provider hosts it.

## Scope

Built (`feat/abacate-pay`):

1. **Organizations and memberships** (`organizations`, `memberships`): the paying party and who
   belongs to it. Authentication/ownership is not wired yet — the functions are `internal`, so
   only other functions, crons and the CLI reach them.
2. **Panel subscription** (`billingSubscriptions`): `pending` (checkout open) → `active` (first
   charge paid or trial started) → `cancelled` (terminal). `openPanelCheckout` opens the hosted
   checkout; the webhook drives every later change.
3. **The webhook inbox** (`billingWebhookDeliveries`): every delivery is stored once per its
   `log_...` id, answered 200, then applied — retries and reorderings are absorbed there.

Not built: the web UI that calls `openPanelCheckout`, the member-facing panel, dunning
notification to the organization on `payment_failed` (the outbox is ready for it).

## API

From AbacatePay's docs (`docs.abacatepay.com`), checked 2026-11-21:

- Every call is `https://api.abacatepay.com/v2/<path>` with `Authorization: Bearer <key>`, JSON
  body, under our usual `AbortSignal.timeout`. A 2xx answers `{ data, success, error }`; a non-2xx
  answers `{ error }` — only the HTTP status reaches our error, never the text.
- **Test mode** keys start `abc_dev_`, production `abc_prod_`: same API, simulated payments, no
  company verification — what the hackathon's rule 6.9 allows for the demo. Dev-mode and
  production objects live in separate stores; each environment provisions its own product.
- **Amounts are integer centavos** everywhere (R$ 100,00 is `10000`).
- **The product** (`POST /products/create`, `GET /products/get`): ours is one `prod_...` named
  "Bratura — perfil gerenciado", `cycle: MONTHLY`, `externalId: bratura-managed-profile`, priced
  per managed profile. `billing:provisionPanelProduct` finds or creates it; its id goes in
  `ABACATE_PAY_PRODUCT_ID`. `trialDays` (1–90) is optional at creation.
- **The customer** (`POST /customers/create`): e-mail is the only required field; the call is
  idempotent on it, so a repeat checkout dedupes to the same `cust_...`.
- **The subscription checkout** (`POST /subscriptions/create`): one product item with
  `quantity` = managed profiles; answers a `bill_...` with a hosted `url` — the only page the
  organization ever sees. `externalId` is `org-<organizationId>`, so a repeat call is the
  provider's dedupe as well. The `subs_...` subscription itself is born only when the first
  charge succeeds (or the trial starts).
- **Change plan** (`POST /subscriptions/change-plan`): schedules a new quantity for the **next
  cycle** — no proration, one pending change at a time, products must share the cycle. Pix
  Automático subscriptions refuse an amount change; the provider's refusal then reaches the
  caller as `unavailable`. Meanwhile `pendingManagedProfiles` holds the asked quantity until the
  provider's `plan_changed` without `pendingUpdateId` lands — that delivery is the applied
  change.
- **Cancel** (`POST /subscriptions/cancel`): immediate and irreversible on the provider; ours
  then marks the row `cancelled` with `cancelledByBratura`.
- **`GET /stores/get`**: `billing:checkAbacatePayCredentials` runs it to prove a key — run it
  after `env set`, like `telegram:checkTelegramCredentials`.
- **`POST /webhooks/create`**: `billing:registerPanelWebhook` registers
  `CONVEX_SITE_URL/abacatepay/webhook` for the six `subscription.*` events below, with
  `ABACATE_PAY_WEBHOOK_SECRET` as the delivery proof.

## Webhook

`POST /abacatepay/webhook` in `http.ts` → `billing.ts`:

- **Proof, before anything reads the body**: the shared secret (`X-Webhook-Secret` header or the
  `webhookSecret` query param, both compared in constant time) and `X-Webhook-Signature`, an
  HMAC-SHA256 over the **raw** body bytes, base64, keyed by the provider's documented public key.
  A failure is a 401; a signed body that is not our envelope is a 400. We accept the signature
  rather than signing ourselves because the key is public — what proves the delivery is the
  secret only we and the provider know.
- **The envelope** is `{ id: "log_...", event, apiVersion, devMode, data }`. `id` is stable
  across retries — the inbox's dedupe key. The provider warns fields may be added, so `data` is
  parsed loosely down to what rows need (`subscription.id/amount/method/cancelledDueTo`,
  `checkout.id`, `pendingUpdateId`); personal fields (`customer`, `payerInformation`) are never
  read, which is stronger than dropping them.
- **Events handled** (all `subscription.*`; `checkout.completed` is deliberately not subscribed —
  every paid subscription charge also emits it, and handling both families would apply twice):
  `completed` and `trial_started` activate, `renewed` refreshes amount and clears the failure
  mark, `payment_failed` marks `lastPaymentFailedAt` (retries still run; the panel stays on),
  `plan_changed` is the pending (`pendingUpdateId` set) or applied quantity change, `cancelled`
  is terminal.
- **Order is not guaranteed** — the row's status decides, not the event's position: a `completed`
  or `renewed` landing on a `cancelled` row is recorded as `superseded` and changes nothing.
- **Store, answer, process**: the handler records the delivery and answers 200, then
  `processAbacatePayDelivery` runs scheduled. A slow or failing apply never turns into a provider
  retry we already deduped; a delivery names its row by `subs_...` first, then by `bill_...`.

## Operations

Secrets and ids live only in the deployment (`pnpm exec convex env set NAME`, prompted, so they
stay out of shell history):

| variable                       | what it proves / holds                          |
| ------------------------------ | ----------------------------------------------- |
| `ABACATE_PAY_API_KEY`          | `abc_dev_...` or `abc_prod_...` (needs product, customer, subscription and webhook permissions, `STORE:READ`) |
| `ABACATE_PAY_PRODUCT_ID`       | the `prod_...` `provisionPanelProduct` answered |
| `ABACATE_PAY_WEBHOOK_SECRET`   | the delivery proof we and the provider share    |
| `CONVEX_SITE_URL`              | the HTTPS host the webhook is registered on     |
| `ABACATE_PAY_COMPLETION_URL`   | optional: where the payer lands after paying    |

Setup, once per deployment (test mode first):

```bash
pnpm exec convex env set ABACATE_PAY_API_KEY          # prompted
pnpm exec convex run billing:checkAbacatePayCredentials '{}'
pnpm exec convex run billing:provisionPanelProduct '{"priceInCents":2990}'   # a product decision
pnpm exec convex env set ABACATE_PAY_PRODUCT_ID       # the prod_... it answered
pnpm exec convex env set ABACATE_PAY_WEBHOOK_SECRET   # a generated random string
pnpm exec convex run billing:registerPanelWebhook '{}'
```

**Not yet checked with real calls** (no account yet — the sandbox key is pending): every request
shape above comes from the docs, so the first real run of `provisionPanelProduct` and a paid test
checkout are the proof. Verify especially: the `plan_changed` payload's `pendingUpdateId`
presence on the applied change, and whether `subscription.amount` is per unit or per cycle.

## Open for brainstorming

1. **Ownership** (when auth lands): `openPanelCheckout`, `changeManagedProfiles` and
   `cancelPanelSubscription` must check the caller owns a membership of the organization —
   everything is `internal` today, so the check is a precondition for exposing them, not a hole.
2. **Dunning** (when the org panel exists): `payment_failed` only marks the row; the
   notification outbox can warn the organization's members the panel will go dark.
3. **Pix Automático** (when a payer asks for it): `methods` is `['CARD']` today; adding `PIX`
   means change-plan stops working (the provider refuses amount changes on Pix), so quantity
   changes would need a cancel-and-reopen path.
4. **Member sync** (when the panel counts real profiles): `managedProfiles` is passed by the
   caller today; a membership/follow count should drive it.
