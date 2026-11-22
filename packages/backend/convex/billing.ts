import { httpAction } from './_generated/server';
import { z } from 'zod';
import { BillingSubscriptionSchema } from '@bratura/shared/entities/billing-subscription/entity';
import { BillingSubscriptionIdentityFields } from '@bratura/shared/entities/billing-subscription/fragments/identity/fields';
import { BillingWebhookDeliverySchema } from '@bratura/shared/entities/billing-webhook-delivery/entity';
import { DeliveryOutcomeEnum } from '@bratura/shared/entities/billing-webhook-delivery/enums/delivery-outcome/enum';
import { documentId } from '@bratura/shared/primitives/code/id/fields';
import { requiredAmountInCents } from '@bratura/shared/primitives/domain/money/fields';
import { CancellationReasonEnum } from '@bratura/shared/primitives/external/abacate-pay/enums/cancellation-reason/enum';
import { requiredString, textLengths } from '@bratura/shared/primitives/code/string/fields';
import { requiredHttpsUrl } from '@bratura/shared/primitives/code/url/fields';
import { internal } from './_generated/api';
import type { Doc } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';
import { appError } from './lib/appError';
import { internalZodAction, internalZodMutation, internalZodQuery } from './lib/builders';
import { optionalEnv, requiredEnv } from './lib/env';
import {
  cancelAbacatePaySubscription,
  changeAbacatePayPlan,
  createAbacatePayProduct,
  createAbacatePaySubscriptionCheckout,
  createAbacatePayWebhook,
  deleteAbacatePaySubscriptionCheckout,
  fetchAbacatePayStore,
  findAbacatePayProduct,
  upsertAbacatePayCustomer,
} from './model/abacatePay/client';
import {
  AbacatePayDeliveryEnvelopeSchema,
  deliveryFieldsFromAbacatePayEvent,
} from './model/abacatePay/payload';
import { abacatePaySecretMatches, abacatePaySignatureMatches } from './model/abacatePay/signature';

// Billing (`docs/integrations/abacate-pay.md`): the panel's monthly subscription per managed
// profile — the only writer of `billingSubscriptions` and `billingWebhookDeliveries`. Handlers
// name return types: without them every `internal` call here silently becomes `any`.

/** The panel product's `externalId` on the provider: one per store, never per organization. */
const panelProductExternalId = 'bratura-managed-profile';
/** The `subscription.*` events our webhook subscribes to — the panel's whole lifecycle. */
const panelWebhookEvents = [
  'subscription.completed',
  'subscription.trial_started',
  'subscription.renewed',
  'subscription.payment_failed',
  'subscription.plan_changed',
  'subscription.cancelled',
];
/** How many stranded deliveries `reprocessUnprocessedDeliveries` handles per run. */
const reprocessBatchCeiling = 25;

// Credentials and catalog ------------------------------------------------------------------------

const CheckAbacatePayCredentialsActionArgsSchema = z.object({});
const CheckAbacatePayCredentialsActionReturnsSchema = z.literal(true);

/** Proves `ABACATE_PAY_API_KEY` answers `GET /stores/get`; charges nothing. */
export const checkAbacatePayCredentials = internalZodAction({
  args: CheckAbacatePayCredentialsActionArgsSchema,
  returns: CheckAbacatePayCredentialsActionReturnsSchema,
  handler: async () => {
    await fetchAbacatePayStore({ apiKey: requiredEnv('ABACATE_PAY_API_KEY') });
    return true as const;
  },
});

const ProvisionPanelProductActionArgsSchema = z.object({
  /** The monthly price per managed profile, in cents — a product decision (`docs/product.md`). */
  priceInCents: requiredAmountInCents,
  /** Free-trial days before the first charge (1–90); omit for none. */
  trialDays: z.int().min(1).max(90).optional(),
});
const ProvisionPanelProductActionReturnsSchema = requiredString('short');
type ProvisionPanelProductResult = z.infer<typeof ProvisionPanelProductActionReturnsSchema>;

/**
 * Finds or creates the panel's subscription product and answers its `prod_...` id — the value to
 * set as `ABACATE_PAY_PRODUCT_ID`. By hand:
 * `pnpm exec convex run billing:provisionPanelProduct '{"priceInCents":2990}'`
 */
export const provisionPanelProduct = internalZodAction({
  args: ProvisionPanelProductActionArgsSchema,
  returns: ProvisionPanelProductActionReturnsSchema,
  handler: async (ctx, { priceInCents, trialDays }): Promise<ProvisionPanelProductResult> => {
    const apiKey = requiredEnv('ABACATE_PAY_API_KEY');
    const existing = await findAbacatePayProduct({
      apiKey,
      externalId: panelProductExternalId,
    });
    if (existing) return existing.id;
    const product = await createAbacatePayProduct({
      apiKey,
      externalId: panelProductExternalId,
      name: 'Bratura — perfil gerenciado',
      priceInCents,
      cycle: 'MONTHLY',
      ...(trialDays === undefined ? {} : { trialDays }),
    });
    return product.id;
  },
});

const RegisterPanelWebhookActionArgsSchema = z.object({
  /** A name the provider's dashboard shows (`Bratura billing` by default). */
  name: requiredString().optional(),
});
const RegisterPanelWebhookActionReturnsSchema = z.object({
  webhookId: requiredString('short'),
  endpoint: requiredHttpsUrl,
});
type RegisterPanelWebhookResult = z.infer<typeof RegisterPanelWebhookActionReturnsSchema>;

/** Points `CONVEX_SITE_URL/abacatepay/webhook` at the provider for every `subscription.*` event. */
export const registerPanelWebhook = internalZodAction({
  args: RegisterPanelWebhookActionArgsSchema,
  returns: RegisterPanelWebhookActionReturnsSchema,
  handler: async (ctx, { name }): Promise<RegisterPanelWebhookResult> => {
    const apiKey = requiredEnv('ABACATE_PAY_API_KEY');
    const endpoint = `${requiredEnv('CONVEX_SITE_URL')}/abacatepay/webhook`;
    const webhook = await createAbacatePayWebhook({
      apiKey,
      name: name ?? 'Bratura billing',
      endpoint,
      secret: requiredEnv('ABACATE_PAY_WEBHOOK_SECRET'),
      events: panelWebhookEvents,
    });
    return { webhookId: webhook.id, endpoint };
  },
});

// The subscription's lifecycle --------------------------------------------------------------------

const GetPanelBillingStateQueryArgsSchema = z.object({
  organizationId: documentId('organizations'),
});
const GetPanelBillingStateQueryReturnsSchema = z.object({
  open: z
    .object({
      billingSubscriptionId: documentId('billingSubscriptions'),
      subscription: BillingSubscriptionSchema,
    })
    .nullable(),
  subscriptionCount: z.number(),
});
type GetPanelBillingStateResult = z.infer<typeof GetPanelBillingStateQueryReturnsSchema>;

/**
 * The organization's open subscription (at most one is open at a time) and how many rows it
 * has ever had — the count builds the next checkout `externalId`.
 */
export const getPanelBillingState = internalZodQuery({
  args: GetPanelBillingStateQueryArgsSchema,
  returns: GetPanelBillingStateQueryReturnsSchema,
  handler: async (ctx, { organizationId }): Promise<GetPanelBillingStateResult> => {
    const rows = await ctx.db
      .query('billingSubscriptions')
      .withIndex('by_organization', (index) => index.eq('organizationId', organizationId))
      .collect();
    const latest = rows
      .filter((row) => row.status !== 'cancelled')
      .sort((a, b) => b._creationTime - a._creationTime)[0];
    return {
      open: latest ? { billingSubscriptionId: latest._id, subscription: latest } : null,
      subscriptionCount: rows.length,
    };
  },
});

const RecordPendingSubscriptionMutationArgsSchema = BillingSubscriptionIdentityFields.omit({
  createdAt: true,
  updatedAt: true,
});
const RecordPendingSubscriptionMutationReturnsSchema = documentId('billingSubscriptions');
type RecordPendingSubscriptionResult = z.infer<
  typeof RecordPendingSubscriptionMutationReturnsSchema
>;

/**
 * Writes the `pending` row behind a checkout the provider just opened. One open subscription
 * per organization; a `bill_` a cancelled row owns is a `conflict` — a second row under it
 * would make `by_checkout` non-unique.
 */
export const recordPendingSubscription = internalZodMutation({
  args: RecordPendingSubscriptionMutationArgsSchema,
  returns: RecordPendingSubscriptionMutationReturnsSchema,
  handler: async (ctx, args): Promise<RecordPendingSubscriptionResult> => {
    const rows = await ctx.db
      .query('billingSubscriptions')
      .withIndex('by_organization', (index) => index.eq('organizationId', args.organizationId))
      .collect();
    const checkoutOwner = await ctx.db
      .query('billingSubscriptions')
      .withIndex('by_checkout', (index) =>
        index.eq('abacatePayCheckoutId', args.abacatePayCheckoutId),
      )
      .unique();
    if (checkoutOwner) {
      if (checkoutOwner.status === 'cancelled') throw appError({ code: 'conflict' });
      if (checkoutOwner.organizationId === args.organizationId) return checkoutOwner._id;
      throw appError({ code: 'conflict' });
    }
    if (rows.some((row) => row.status !== 'cancelled')) throw appError({ code: 'conflict' });
    const now = Date.now();
    return await ctx.db.insert('billingSubscriptions', {
      status: 'pending',
      ...args,
      lastPaymentFailedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  },
});

const OpenPanelCheckoutActionArgsSchema = z.object({
  organizationId: documentId('organizations'),
  /** How many managed profiles the cycle bills: the "per managed profile" price times this. */
  managedProfiles: z.int().positive(),
  /** The contact AbacatePay bills; e-mail is the only required field of its customer. */
  customerEmail: z.email().max(textLengths.medium),
  customerName: requiredString().optional(),
  /** CNPJ or CPF of the paying organization; the provider validates it. */
  customerTaxId: requiredString('short').optional(),
  customerCellphone: requiredString('short').optional(),
});
const OpenPanelCheckoutActionReturnsSchema = z.object({
  billingSubscriptionId: documentId('billingSubscriptions'),
  /** Where the organization pays the first charge: an AbacatePay-hosted page. */
  checkoutUrl: requiredHttpsUrl,
  /** `true` when the organization already had a checkout waiting — nothing was created. */
  reusedPendingCheckout: z.boolean(),
});
type OpenPanelCheckoutResult = z.infer<typeof OpenPanelCheckoutActionReturnsSchema>;

/**
 * Opens the organization's panel subscription: dedupes the provider customer, opens a
 * subscription checkout (a new `externalId` per attempt, `org-<id>-<n>`) and records the
 * `pending` row. A pending checkout is handed back as is — `cancelPanelSubscription` ends it.
 */
export const openPanelCheckout = internalZodAction({
  args: OpenPanelCheckoutActionArgsSchema,
  returns: OpenPanelCheckoutActionReturnsSchema,
  handler: async (ctx, args): Promise<OpenPanelCheckoutResult> => {
    const apiKey = requiredEnv('ABACATE_PAY_API_KEY');
    const productId = requiredEnv('ABACATE_PAY_PRODUCT_ID');
    const completionUrl = optionalEnv('ABACATE_PAY_COMPLETION_URL');
    const organization = await ctx.runQuery(internal.organizations.getOrganization, {
      organizationId: args.organizationId,
    });
    if (!organization) throw appError({ code: 'notFound' });
    const state = await ctx.runQuery(internal.billing.getPanelBillingState, {
      organizationId: args.organizationId,
    });
    if (state.open?.subscription.status === 'active') throw appError({ code: 'conflict' });
    if (state.open?.subscription.status === 'pending') {
      return {
        billingSubscriptionId: state.open.billingSubscriptionId,
        checkoutUrl: state.open.subscription.checkoutUrl,
        reusedPendingCheckout: true,
      };
    }
    const customer = await upsertAbacatePayCustomer({
      apiKey,
      email: args.customerEmail,
      ...(args.customerName === undefined ? {} : { name: args.customerName }),
      ...(args.customerTaxId === undefined ? {} : { taxId: args.customerTaxId }),
      ...(args.customerCellphone === undefined ? {} : { cellphone: args.customerCellphone }),
    });
    const checkout = await createAbacatePaySubscriptionCheckout({
      apiKey,
      productId,
      quantity: args.managedProfiles,
      customerId: customer.id,
      externalId: `org-${args.organizationId}-${state.subscriptionCount + 1}`,
      methods: ['CARD'],
      ...(completionUrl == null ? {} : { completionUrl }),
    });
    const billingSubscriptionId = await ctx.runMutation(
      internal.billing.recordPendingSubscription,
      {
        organizationId: args.organizationId,
        abacatePayCheckoutId: checkout.id,
        checkoutUrl: checkout.url,
        abacatePayCustomerId: customer.id,
        managedProfiles: args.managedProfiles,
        devMode: checkout.devMode,
      },
    );
    return { billingSubscriptionId, checkoutUrl: checkout.url, reusedPendingCheckout: false };
  },
});

/** The `cancelled` variant of an open row, built once for both our cancel and the event's. */
const cancelledRowFrom = (
  row: Doc<'billingSubscriptions'>,
  abacatePaySubscriptionId: string | null,
  cancelledDueTo: z.infer<typeof CancellationReasonEnum> | null,
  now: number,
) => ({
  ...BillingSubscriptionIdentityFields.parse(row),
  updatedAt: now,
  status: 'cancelled' as const,
  abacatePaySubscriptionId,
  activatedAt: row.status === 'active' ? row.activatedAt : null,
  cancelledAt: now,
  cancelledDueTo,
});

const MarkSubscriptionCancelledMutationArgsSchema = z.object({
  billingSubscriptionId: documentId('billingSubscriptions'),
  cancelledDueTo: CancellationReasonEnum,
});
const MarkSubscriptionCancelledMutationReturnsSchema = z.null();
type MarkSubscriptionCancelledResult = z.infer<
  typeof MarkSubscriptionCancelledMutationReturnsSchema
>;

/** Ends an open row after a cancel the provider confirmed; a row already cancelled is a no-op. */
export const markSubscriptionCancelled = internalZodMutation({
  args: MarkSubscriptionCancelledMutationArgsSchema,
  returns: MarkSubscriptionCancelledMutationReturnsSchema,
  handler: async (
    ctx,
    { billingSubscriptionId, cancelledDueTo },
  ): Promise<MarkSubscriptionCancelledResult> => {
    const row = await ctx.db.get(billingSubscriptionId);
    if (!row || row.status === 'cancelled') return null;
    await ctx.db.replace(
      billingSubscriptionId,
      cancelledRowFrom(
        row,
        row.status === 'active' ? row.abacatePaySubscriptionId : null,
        cancelledDueTo,
        Date.now(),
      ),
    );
    return null;
  },
});

const CancelPanelSubscriptionActionArgsSchema = z.object({
  organizationId: documentId('organizations'),
});
const CancelPanelSubscriptionActionReturnsSchema = z.literal(true);
type CancelPanelSubscriptionResult = z.infer<typeof CancelPanelSubscriptionActionReturnsSchema>;

/**
 * Ends the organization's open subscription: `cancelPolicy: NOW` on an active one, deleting
 * the unpaid `bill_...` on a pending one (the provider emits no event for an expired checkout).
 * No un-cancel: a new panel starts from a new checkout.
 */
export const cancelPanelSubscription = internalZodAction({
  args: CancelPanelSubscriptionActionArgsSchema,
  returns: CancelPanelSubscriptionActionReturnsSchema,
  handler: async (ctx, { organizationId }): Promise<CancelPanelSubscriptionResult> => {
    const apiKey = requiredEnv('ABACATE_PAY_API_KEY');
    const state = await ctx.runQuery(internal.billing.getPanelBillingState, { organizationId });
    const open = state.open;
    if (!open) throw appError({ code: 'notFound' });
    if (open.subscription.status === 'active') {
      await cancelAbacatePaySubscription({
        apiKey,
        subscriptionId: open.subscription.abacatePaySubscriptionId,
      });
    } else if (open.subscription.status === 'pending') {
      await deleteAbacatePaySubscriptionCheckout({
        apiKey,
        checkoutId: open.subscription.abacatePayCheckoutId,
      });
    } else {
      throw appError({ code: 'notFound' });
    }
    await ctx.runMutation(internal.billing.markSubscriptionCancelled, {
      billingSubscriptionId: open.billingSubscriptionId,
      cancelledDueTo: 'cancelledByBratura',
    });
    return true as const;
  },
});

const RecordPlanChangeMutationArgsSchema = z.object({
  billingSubscriptionId: documentId('billingSubscriptions'),
  managedProfiles: z.int().positive(),
});
const RecordPlanChangeMutationReturnsSchema = z.null();
type RecordPlanChangeResult = z.infer<typeof RecordPlanChangeMutationReturnsSchema>;

/**
 * Notes the quantity a change-plan call scheduled: it bills from the next cycle only, so it
 * waits in `pendingManagedProfiles` until the provider's applied `plan_changed` confirms it.
 */
export const recordPlanChange = internalZodMutation({
  args: RecordPlanChangeMutationArgsSchema,
  returns: RecordPlanChangeMutationReturnsSchema,
  handler: async (
    ctx,
    { billingSubscriptionId, managedProfiles },
  ): Promise<RecordPlanChangeResult> => {
    const row = await ctx.db.get(billingSubscriptionId);
    if (row?.status !== 'active') return null;
    await ctx.db.patch(billingSubscriptionId, {
      pendingManagedProfiles: managedProfiles,
      updatedAt: Date.now(),
    });
    return null;
  },
});

const ChangeManagedProfilesActionArgsSchema = z.object({
  organizationId: documentId('organizations'),
  managedProfiles: z.int().positive(),
});
const ChangeManagedProfilesActionReturnsSchema = z.object({
  /** The provider's pending update (`subu_...`), applied at the next cycle charge. */
  updateId: requiredString('short'),
});
type ChangeManagedProfilesResult = z.infer<typeof ChangeManagedProfilesActionReturnsSchema>;

/**
 * Schedules a new billed quantity for the next cycle (the provider's change-plan: no proration,
 * one pending change at a time). A provider failure — a refused call or an unreachable API —
 * reaches the caller as `unavailable`, never as provider text.
 */
export const changeManagedProfiles = internalZodAction({
  args: ChangeManagedProfilesActionArgsSchema,
  returns: ChangeManagedProfilesActionReturnsSchema,
  handler: async (
    ctx,
    { organizationId, managedProfiles },
  ): Promise<ChangeManagedProfilesResult> => {
    const apiKey = requiredEnv('ABACATE_PAY_API_KEY');
    const productId = requiredEnv('ABACATE_PAY_PRODUCT_ID');
    const state = await ctx.runQuery(internal.billing.getPanelBillingState, { organizationId });
    const open = state.open;
    if (!open || open.subscription.status !== 'active') throw appError({ code: 'notFound' });
    const change = await changeAbacatePayPlan({
      apiKey,
      subscriptionId: open.subscription.abacatePaySubscriptionId,
      productId,
      quantity: managedProfiles,
    });
    await ctx.runMutation(internal.billing.recordPlanChange, {
      billingSubscriptionId: open.billingSubscriptionId,
      managedProfiles,
    });
    return { updateId: change.updateId };
  },
});

// The webhook inbox -------------------------------------------------------------------------------

const RecordAbacatePayDeliveryMutationArgsSchema = BillingWebhookDeliverySchema.omit({
  billingSubscriptionId: true,
  receivedAt: true,
  processedAt: true,
  outcome: true,
}).extend({
  /** A delivery resolved at record time: `unparsed` (no usable ids) or `ignored` (not ours). */
  resolvedOutcome: z.enum(['unparsed', 'ignored']).optional(),
});
const RecordAbacatePayDeliveryMutationReturnsSchema = z.union([
  z.object({
    outcome: z.literal('stored'),
    billingWebhookDeliveryId: documentId('billingWebhookDeliveries'),
  }),
  z.object({ outcome: z.literal('duplicate') }),
]);
type RecordAbacatePayDeliveryResult = z.infer<typeof RecordAbacatePayDeliveryMutationReturnsSchema>;

/**
 * The webhook's only write before it answers: a delivery is stored once per provider `log_` id,
 * so retries never apply twice. A `resolvedOutcome` marks it processed now — an `unparsed` one
 * can never re-run (the raw body is gone), an `ignored` one was never meant for us.
 */
export const recordAbacatePayDelivery = internalZodMutation({
  args: RecordAbacatePayDeliveryMutationArgsSchema,
  returns: RecordAbacatePayDeliveryMutationReturnsSchema,
  handler: async (ctx, args): Promise<RecordAbacatePayDeliveryResult> => {
    const known = await ctx.db
      .query('billingWebhookDeliveries')
      .withIndex('by_delivery', (index) => index.eq('deliveryId', args.deliveryId))
      .unique();
    if (known) return { outcome: 'duplicate' };
    const { resolvedOutcome, ...delivery } = args;
    const now = Date.now();
    const billingWebhookDeliveryId = await ctx.db.insert('billingWebhookDeliveries', {
      ...delivery,
      billingSubscriptionId: null,
      receivedAt: now,
      processedAt: resolvedOutcome === undefined ? null : now,
      outcome: resolvedOutcome ?? null,
    });
    return { outcome: 'stored', billingWebhookDeliveryId };
  },
});

/** The billing row an event names, by `subs_` first (the lasting id), then by `bill_`. */
async function findBillingSubscriptionFor(
  ctx: MutationCtx,
  delivery: Doc<'billingWebhookDeliveries'>,
) {
  if (delivery.abacatePaySubscriptionId) {
    const bySubscription = await ctx.db
      .query('billingSubscriptions')
      .withIndex('by_subscription', (index) =>
        index.eq('abacatePaySubscriptionId', delivery.abacatePaySubscriptionId!),
      )
      .unique();
    if (bySubscription) return bySubscription;
  }
  if (delivery.abacatePayCheckoutId) {
    return await ctx.db
      .query('billingSubscriptions')
      .withIndex('by_checkout', (index) =>
        index.eq('abacatePayCheckoutId', delivery.abacatePayCheckoutId!),
      )
      .unique();
  }
  return null;
}

/**
 * Applies one stored delivery to its row and marks it processed — shared by
 * `processAbacatePayDelivery` and `reprocessUnprocessedDeliveries`. `cancelled` is terminal; a
 * `PENDING` `plan_changed` records the asked quantity, one without request fields is applied.
 */
async function applyAbacatePayDelivery(
  ctx: MutationCtx,
  billingWebhookDeliveryId: Doc<'billingWebhookDeliveries'>['_id'],
): Promise<void> {
  const delivery = await ctx.db.get(billingWebhookDeliveryId);
  if (!delivery || delivery.processedAt !== null) return;
  const row = await findBillingSubscriptionFor(ctx, delivery);
  const finish = async (outcome: z.infer<typeof DeliveryOutcomeEnum>) => {
    await ctx.db.patch(billingWebhookDeliveryId, {
      processedAt: Date.now(),
      outcome,
      billingSubscriptionId: row?._id ?? null,
    });
  };
  if (!delivery.event.startsWith('subscription.')) {
    await finish('ignored');
    return;
  }
  if (!row) {
    await finish('unmatchedSubscription');
    return;
  }
  const now = Date.now();
  switch (delivery.event) {
    case 'subscription.completed':
    case 'subscription.trial_started':
    case 'subscription.renewed': {
      if (row.status === 'cancelled') {
        // A charge landing on a closed row means the provider billed a panel that is off —
        // log it loudly so someone can cancel or refund on the provider's dashboard.
        console.error(
          `AbacatePay delivery ${delivery.deliveryId} (${delivery.event}) charged a cancelled row`,
          delivery.abacatePaySubscriptionId,
        );
        await finish('superseded');
        return;
      }
      if (delivery.abacatePaySubscriptionId === null) {
        await finish('ignored');
        return;
      }
      if (row.status === 'pending') {
        await ctx.db.replace(row._id, {
          ...BillingSubscriptionIdentityFields.parse(row),
          updatedAt: now,
          status: 'active',
          abacatePaySubscriptionId: delivery.abacatePaySubscriptionId,
          activatedAt: now,
          method: delivery.method,
          amountInCents: delivery.amountInCents,
          lastRenewedAt: delivery.event === 'subscription.renewed' ? now : null,
          lastPaymentFailedAt: null,
          pendingManagedProfiles: null,
        });
      } else {
        await ctx.db.patch(row._id, {
          updatedAt: now,
          abacatePaySubscriptionId: delivery.abacatePaySubscriptionId,
          method: delivery.method ?? row.method,
          amountInCents: delivery.amountInCents ?? row.amountInCents,
          lastRenewedAt: delivery.event === 'subscription.renewed' ? now : row.lastRenewedAt,
          lastPaymentFailedAt: null,
        });
      }
      await finish('applied');
      return;
    }
    case 'subscription.payment_failed': {
      if (row.status === 'cancelled') {
        await finish('superseded');
        return;
      }
      await ctx.db.patch(row._id, { updatedAt: now, lastPaymentFailedAt: now });
      await finish('applied');
      return;
    }
    case 'subscription.plan_changed': {
      if (row.status === 'cancelled') {
        await finish('superseded');
        return;
      }
      if (row.status !== 'active') {
        await ctx.db.patch(row._id, { updatedAt: now });
        await finish('applied');
        return;
      }
      // The requested event carries `status: PENDING` and `pendingUpdateId`; the applied one
      // comes without the request fields and with the new cycle charge in `subscription.amount`.
      if (delivery.planChangeStatus === 'PENDING' || delivery.pendingUpdateId !== null) {
        await ctx.db.patch(row._id, {
          updatedAt: now,
          pendingManagedProfiles: delivery.quantity ?? row.pendingManagedProfiles,
        });
      } else if (row.pendingManagedProfiles === null) {
        // An applied change with nothing pending (a dashboard change whose request event has
        // not landed): the event carries no new quantity, so only the amount moves.
        console.warn(
          `AbacatePay delivery ${delivery.deliveryId} applied a plan change with nothing pending`,
          delivery.abacatePaySubscriptionId,
        );
        await ctx.db.patch(row._id, {
          updatedAt: now,
          amountInCents: delivery.amountInCents ?? row.amountInCents,
        });
      } else {
        await ctx.db.patch(row._id, {
          updatedAt: now,
          managedProfiles: row.pendingManagedProfiles,
          pendingManagedProfiles: null,
          amountInCents: delivery.amountInCents ?? row.amountInCents,
        });
      }
      await finish('applied');
      return;
    }
    case 'subscription.cancelled': {
      // A cancel we asked for marks the row before the provider's event lands: a second
      // cancelled must not wipe `activatedAt`/`cancelledDueTo` — it is superseded like
      // every other event after the terminal status.
      if (row.status === 'cancelled') {
        await finish('superseded');
        return;
      }
      await ctx.db.replace(
        row._id,
        cancelledRowFrom(
          row,
          delivery.abacatePaySubscriptionId ??
            (row.status === 'active' ? row.abacatePaySubscriptionId : null),
          delivery.cancelledDueTo,
          now,
        ),
      );
      await finish('applied');
      return;
    }
    default: {
      await finish('ignored');
      return;
    }
  }
}

const ProcessAbacatePayDeliveryMutationArgsSchema = z.object({
  billingWebhookDeliveryId: documentId('billingWebhookDeliveries'),
});
const ProcessAbacatePayDeliveryMutationReturnsSchema = z.null();
type ProcessAbacatePayDeliveryResult = z.infer<
  typeof ProcessAbacatePayDeliveryMutationReturnsSchema
>;

/** Applies one stored delivery; re-running on a processed delivery is a no-op. */
export const processAbacatePayDelivery = internalZodMutation({
  args: ProcessAbacatePayDeliveryMutationArgsSchema,
  returns: ProcessAbacatePayDeliveryMutationReturnsSchema,
  handler: async (ctx, { billingWebhookDeliveryId }): Promise<ProcessAbacatePayDeliveryResult> => {
    await applyAbacatePayDelivery(ctx, billingWebhookDeliveryId);
    return null;
  },
});

const ReprocessUnprocessedDeliveriesMutationArgsSchema = z.object({
  limit: z.int().positive().max(reprocessBatchCeiling).optional(),
});
const ReprocessUnprocessedDeliveriesMutationReturnsSchema = z.object({
  reprocessed: z.number(),
  hasMore: z.boolean(),
});
type ReprocessUnprocessedDeliveriesResult = z.infer<
  typeof ReprocessUnprocessedDeliveriesMutationReturnsSchema
>;

/**
 * Re-runs deliveries a scheduled process never finished (`processedAt` still null), a bounded
 * batch at a time: `pnpm exec convex run billing:reprocessUnprocessedDeliveries '{}'`
 */
export const reprocessUnprocessedDeliveries = internalZodMutation({
  args: ReprocessUnprocessedDeliveriesMutationArgsSchema,
  returns: ReprocessUnprocessedDeliveriesMutationReturnsSchema,
  handler: async (ctx, { limit }): Promise<ReprocessUnprocessedDeliveriesResult> => {
    const batchSize = limit ?? reprocessBatchCeiling;
    const stranded = await ctx.db
      .query('billingWebhookDeliveries')
      .withIndex('by_processed', (index) => index.eq('processedAt', null))
      .take(batchSize + 1);
    for (const delivery of stranded.slice(0, batchSize)) {
      await applyAbacatePayDelivery(ctx, delivery._id);
    }
    return {
      reprocessed: Math.min(batchSize, stranded.length),
      hasMore: stranded.length > batchSize,
    };
  },
});

/**
 * The route `http.ts` exposes: verifies the secret and the HMAC signature over the raw body,
 * records the delivery, answers 200 — `processAbacatePayDelivery` then applies it scheduled, so
 * a slow apply never turns into a retry we already deduped.
 */
export const abacatePayWebhook = httpAction(async (ctx, request) => {
  const expectedSecret = optionalEnv('ABACATE_PAY_WEBHOOK_SECRET');
  const receivedSecret =
    request.headers.get('x-webhook-secret') ??
    new URL(request.url).searchParams.get('webhookSecret') ??
    '';
  if (!expectedSecret || !abacatePaySecretMatches(receivedSecret, expectedSecret)) {
    return new Response('Forbidden', { status: 403 });
  }
  const rawBody = new Uint8Array(await request.arrayBuffer());
  const signature = request.headers.get('x-webhook-signature') ?? '';
  if (!(await abacatePaySignatureMatches(rawBody, signature))) {
    return new Response('Forbidden', { status: 403 });
  }
  let envelope: z.infer<typeof AbacatePayDeliveryEnvelopeSchema>;
  try {
    envelope = AbacatePayDeliveryEnvelopeSchema.parse(
      JSON.parse(new TextDecoder().decode(rawBody)),
    );
  } catch {
    return new Response('Bad Request', { status: 400 });
  }
  const fields = deliveryFieldsFromAbacatePayEvent(envelope.data);
  // An event that is not ours resolves as `ignored` before the id check — a signed
  // `payout.completed` must not warn or schedule anything.
  const resolvedOutcome = !envelope.event.startsWith('subscription.')
    ? ('ignored' as const)
    : fields.abacatePaySubscriptionId === null && fields.abacatePayCheckoutId === null
      ? ('unparsed' as const)
      : undefined;
  if (resolvedOutcome === 'unparsed') {
    console.warn(`AbacatePay delivery ${envelope.id} (${envelope.event}) carried no usable ids`, {
      subscriptionIdPresent: fields.subscriptionIdPresent,
      checkoutIdPresent: fields.checkoutIdPresent,
    });
  }
  const record = await ctx.runMutation(internal.billing.recordAbacatePayDelivery, {
    deliveryId: envelope.id,
    event: envelope.event,
    devMode: envelope.devMode ?? false,
    abacatePaySubscriptionId: fields.abacatePaySubscriptionId,
    abacatePayCheckoutId: fields.abacatePayCheckoutId,
    amountInCents: fields.amountInCents,
    method: fields.method,
    pendingUpdateId: fields.pendingUpdateId,
    planChangeStatus: fields.planChangeStatus,
    quantity: fields.quantity,
    newAmountInCents: fields.newAmountInCents,
    cancelledDueTo: fields.cancelledDueTo,
    ...(resolvedOutcome === undefined ? {} : { resolvedOutcome }),
  });
  if (record.outcome === 'stored' && resolvedOutcome === undefined) {
    await ctx.scheduler.runAfter(0, internal.billing.processAbacatePayDelivery, {
      billingWebhookDeliveryId: record.billingWebhookDeliveryId,
    });
  }
  return new Response('OK', { status: 200 });
});
