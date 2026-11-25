# AbacatePay

The **billing provider** of Bratura — the first payment gateway in the project. It charges the
**organization panel** only: a monthly subscription whose quantity is the number of creators the
organization manages (the "per managed profile" price). The paid creator plans of the Freemium
Impact model (`docs/plan.md`, Who pays) are not built: nothing here charges a creator yet. Backend
only so far: no screen builds the checkout, the provider hosts it.

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
  answers `{ error }`. Every failure — non-2xx, a failed or malformed envelope, a timeout — is
  thrown as `unavailable` in one place (`callAbacatePay`); the log keeps the status and the
  route, and the provider's error text never reaches a table, a caller or a log.
- **Test mode** keys start `abc_dev_`, production `abc_prod_`: same API, simulated payments, no
  company verification — what the hackathon's rule 6.9 allows for the demo. Dev-mode and
  production objects live in separate stores; each environment provisions its own product.
- **Amounts are integer centavos** everywhere (R$ 100,00 is `10000`).
- **The product** (`POST /products/create`, `GET /products/list`): ours is one `prod_...` named
  "Bratura — perfil gerenciado", `cycle: MONTHLY`, `externalId: bratura-managed-profile`, priced
  per managed profile. `billing:provisionPanelProduct` finds or creates it; its id goes in
  `ABACATE_PAY_PRODUCT_ID`. `trialDays` (1–90) is optional at creation.
- **The customer** (`POST /customers/create`): e-mail is the only required field; the call is
  idempotent on it, so a repeat checkout dedupes to the same `cust_...`.
- **The subscription checkout** (`POST /subscriptions/create`): one product item with
  `quantity` = managed profiles; answers a `bill_...` with a hosted `url` — the only page the
  organization ever sees. `externalId` is `org-<organizationId>-<n>` where `n` counts the
  organization's subscription rows plus one: a fresh id per attempt, so the provider's dedupe
  still catches concurrent repeats and a reopen after a cancel never asks for the dead `bill_`.
  The `subs_...` subscription itself is born only when the first charge succeeds (or the trial
  starts). The checkout is created with the provider's `retryPolicy` of 3 charge retries, 2
  days apart (the named `abacatePayChargeRetryPolicy` in `client.ts`).
- **Change plan** (`POST /subscriptions/change-plan`): schedules a new quantity for the **next
  cycle** — no proration, one pending change at a time, products must share the cycle. Pix
  Automático subscriptions refuse an amount change; the provider's refusal then reaches the
  caller as `unavailable`. The provider emits `plan_changed` twice: the request event carries
  `data.status: "PENDING"`, `pendingUpdateId`, `quantity` and `newAmount` — it only records the
  asked quantity in `pendingManagedProfiles`. The applied event comes on the next charge
  **without** the request fields, with the new cycle charge in `subscription.amount`: it moves
  `pendingManagedProfiles` into `managedProfiles`. A change made on the provider's dashboard
  lands through its request event just like ours — and the applied event says nothing about
  the new quantity (its `checkout.items` keeps the original item), so with nothing pending
  only the amount moves and the delivery is logged.
- **Cancel** (`POST /subscriptions/cancel`): immediate and irreversible on the provider; ours
  then marks the row `cancelled` with `cancelledByBratura`. On a `pending` row —
  `POST /subscriptions/checkouts/delete` instead: the unpaid `bill_...` stops accepting payment,
  which is how an abandoned or mis-quantified checkout gets a way out (the provider emits no
  event when one expires).
- **Cancellation reasons**: the event's `cancelledDueTo` is free text that can carry a
  payer-typed motive ("Cancelada pelo cliente no portal: <reason>"). It is read only to map it
  to our `CancellationReasonEnum` at the edge (`cancellationReasonFromAbacatePay` in
  `payload.ts`): `customerPortal`, `customerRefund`, `maxPaymentRetriesExceeded`,
  `disputeOpened`, `pixAuthorizationRefused`, `accountClosed`, `cancelledByBratura`, `other`
  — the provider's text itself never reaches a table or a log.
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
  A failure is a 403; a signed body that is not our envelope is a 400. Because the signing key
  is public, the signature proves the body arrived intact — only the secret proves the delivery
  is really ours (see "Open for brainstorming" for what this means when the panel unlocks).
- **The envelope** is `{ id: "log_...", event, apiVersion, devMode, data }`. `id` is stable
  across retries — the inbox's dedupe key. `data` parses through one Zod schema
  (`deliveryFieldsFromAbacatePayEvent`) with `.catch` per field: a bad field becomes `null`
  alone, so an oversized reason or an unknown `method` cannot erase the `subs_...`/`bill_...`
  that locate the row — and a `data` that is not even an object parses to all-null, never
  throws. If neither id parses, the delivery is stored already resolved as `unparsed` (the
  event name and which of the two ids were present are logged, never values) — the raw body
  is gone, so it can never be re-run. Personal fields (`customer`, `payerInformation`) are
  never read, which is stronger than dropping them.
- **Events handled** (all `subscription.*`; `checkout.completed` is deliberately not subscribed —
  every paid subscription charge also emits it, and handling both families would apply twice):
  `completed` and `trial_started` activate, `renewed` refreshes amount and clears the failure
  mark, `payment_failed` marks `lastPaymentFailedAt` (retries still run; the panel stays on),
  `plan_changed` is the requested (`PENDING`) or applied quantity change, `cancelled` is
  terminal.
- **Order is not guaranteed** — the row's status decides, not the event's position: a `completed`
  or `renewed` landing on a `cancelled` row is recorded as `superseded` and changes nothing.
- **Store, answer, process**: the handler records the delivery and answers 200, then
  `processAbacatePayDelivery` runs scheduled. A slow or failing apply never turns into a provider
  retry we already deduped; a delivery names its row by `subs_...` first, then by `bill_...`. A
  delivery a scheduled run never finished (`processedAt` still null) can be re-run by hand with
  `billing:reprocessUnprocessedDeliveries`. A non-`subscription.*` event is stored already
  resolved as `ignored` — silently, nothing scheduled.

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

A pending row left open when `checkouts/delete` succeeded but `markSubscriptionCancelled`
failed (the provider sends no event for a deleted checkout) is closed by hand:

```bash
pnpm exec convex run billing:markSubscriptionCancelled '{"billingSubscriptionId":"…","cancelledDueTo":"cancelledByBratura"}'
```

**Checked with real calls, 2026-11-21/22** (sandbox `abc_dev_` key on a dev deployment, no
production data): `stores/get`, `products/list` + `create`, `customers/create`,
`subscriptions/create`, `change-plan`, `cancel` and `webhooks/create` all answered as
documented, and a paid test checkout delivered a real signed `subscription.completed` — secret
and HMAC verified, the inbox applied it, the row went `active` with a real `subs_...`. Learned
live: `subscription.amount` is the **cycle total** in cents (8970 for 3 × 2990), not the unit
price; `/products/get` answers **400** on a miss, which is why the product lookup walks
`/products/list` instead of trusting a status code; a real `plan_changed` request arrived with
`pendingUpdateId` set (`subu_...`) and our row kept the old quantity as billed; and a provider
`subscription.cancelled` landing after our own cancel used to wipe `activatedAt` —
`cancelled` is now guarded as terminal like every other event. Cancel-and-reopen was exercised
live too: attempt 1 `bill_XBFJmN2KtFCsEchZq1LskfNp` (paid, cancelled), attempt 2
`bill_DB2ndn1enXcz5nsbMm4XqXsa` (`org-<id>-2`, deleted as a pending checkout), attempt 3
`bill_5hQZaBC44mwccm2HRk0dxjJ5` (`org-<id>-3`, still pending) — three distinct `bill_`, no
duplicate. Two live API corrections this round: `checkouts/delete` takes the `id` in the
**query string**, and old delivery rows needed a backfill before the new required fields
pushed. Still unproven: the applied `plan_changed` event, `payment_failed` and `renewed` —
they need a live cycle to fire.

## Open for brainstorming

- **When the panel unlocks anything meaningful**: confirm an activating delivery against the
  provider's API before turning it on. The HMAC key is public and the shared secret travels in
  the URL — whoever knows the secret can emit a signed `subscription.completed` today. Cheap
  insurance: `GET` the subscription by the `subs_...` the event named before activating.
- **When the panel counts real creators**: decide which table is the source of truth for
  `managedProfiles`. It is a number the caller passes today (`memberships` are the
  organization's users, not the creators it follows); the count should come from a
  follow/managed table that does not exist yet.
- **When the payment-failure policy is decided**: `payment_failed` only marks the row today.
  Define the dunning flow — grace period, notification to the organization's members, when the
  panel goes dark — before cutting access.
- **When Pix Automático is supported**: `methods` is `['CARD']` today. Pix refuses amount
  changes on change-plan, so quantity changes would need a cancel-and-reopen path, and its
  authorization events need mapping.
- **Ownership** (when auth lands): `openPanelCheckout`, `changeManagedProfiles` and
  `cancelPanelSubscription` must check the caller owns a membership of the organization —
  everything is `internal` today, so the check is a precondition for exposing them, not a hole.
- **When a charge lands on a `cancelled` row** (cancel raced the payment, or the provider
  deleted a checkout whose payment was already in): the delivery is `superseded` and logged as
  an error with its `log_` and `subs_` — whoever sees the log cancels or refunds on the
  provider's dashboard. Decide then whether it deserves an alert.
- **When an applied `plan_changed` lands before its request event** (order is not guaranteed):
  the row keeps `managedProfiles`, takes the new `amountInCents`, and logs the delivery; the
  late request then leaves a stale `pendingManagedProfiles` behind. Decide then whether the
  late request should be cleared.
- **Customer-portal cancels are `NEXT_CYCLE`**: a payer cancelling on the provider's portal keeps
  access until the paid cycle ends; our `cancelled` is terminal on arrival, so the panel turns
  off early. Revisit if organizations ever cancel through the portal.
