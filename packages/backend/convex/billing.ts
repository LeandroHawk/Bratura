import { httpAction } from './_generated/server';
import { z } from 'zod';
import { BillingSubscriptionSchema } from '@bratura/shared/entities/billing-subscription/entity';
import { BillingSubscriptionIdentityFields } from '@bratura/shared/entities/billing-subscription/fragments/identity/fields';
import { DeliveryOutcomeEnum } from '@bratura/shared/entities/billing-webhook-delivery/enums/delivery-outcome/enum';
import { documentId } from '@bratura/shared/primitives/code/id/fields';
import { requiredAmountInCents } from '@bratura/shared/primitives/domain/money/fields';
import {
  nullableAbacatePayCheckoutId,
  nullableAbacatePaySubscriptionId,
  nullableAmountInCents,
  nullableCancellationReason,
  nullablePaymentMethod,
  requiredAbacatePayCheckoutId,
} from '@bratura/shared/primitives/external/abacate-pay/fields';
import { CancellationReasonEnum } from '@bratura/shared/primitives/external/abacate-pay/enums/cancellation-reason/enum';
import {
  nullableString,
  requiredString,
  textLengths,
} from '@bratura/shared/primitives/code/string/fields';
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
  parseAbacatePayEventData,
} from './model/abacatePay/payload';
import { abacatePaySecretMatches, abacatePaySignatureMatches } from './model/abacatePay/signature';

// Billing (`docs/integrations/abacate-pay.md`): the organization panel's monthly subscription,
// billed per managed profile by AbacatePay — the only writer of `billingSubscriptions` and
// `billingWebhookDeliveries`. Handlers name their return types: this module calls its own
// functions through `internal`, and without them every `internal` type silently becomes `any`.

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

const GetOpenPanelSubscriptionQueryArgsSchema = z.object({
  organizationId: documentId('organizations'),
});
const GetOpenPanelSubscriptionQueryReturnsSchema = z
  .object({
    billingSubscriptionId: documentId('billingSubscriptions'),
    subscription: BillingSubscriptionSchema,
  })
  .nullable();
type GetOpenPanelSubscriptionResult = z.infer<typeof GetOpenPanelSubscriptionQueryReturnsSchema>;

/** The organization's subscription that is not cancelled — at most one is open at a time. */
export const getOpenPanelSubscription = internalZodQuery({
  args: GetOpenPanelSubscriptionQueryArgsSchema,
  returns: GetOpenPanelSubscriptionQueryReturnsSchema,
  handler: async (ctx, { organizationId }): Promise<GetOpenPanelSubscriptionResult> => {
    const rows = await ctx.db
      .query('billingSubscriptions')
      .withIndex('by_organization', (index) => index.eq('organizationId', organizationId))
      .collect();
    const open = rows.filter((row) => row.status !== 'cancelled');
    const latest = open.sort((a, b) => b._creationTime - a._creationTime)[0];
    if (!latest) return null;
    return { billingSubscriptionId: latest._id, subscription: latest };
  },
});

const CountBillingSubscriptionsQueryArgsSchema = z.object({
  organizationId: documentId('organizations'),
});
const CountBillingSubscriptionsQueryReturnsSchema = z.number();
type CountBillingSubscriptionsResult = z.infer<typeof CountBillingSubscriptionsQueryReturnsSchema>;

/** How many subscription rows the organization has ever had: builds the next `externalId`. */
export const countBillingSubscriptions = internalZodQuery({
  args: CountBillingSubscriptionsQueryArgsSchema,
  returns: CountBillingSubscriptionsQueryReturnsSchema,
  handler: async (ctx, { organizationId }): Promise<CountBillingSubscriptionsResult> => {
    const rows = await ctx.db
      .query('billingSubscriptions')
      .withIndex('by_organization', (index) => index.eq('organizationId', organizationId))
      .collect();
    return rows.length;
  },
});

const RecordPendingSubscriptionMutationArgsSchema = z.object({
  organizationId: documentId('organizations'),
  abacatePayCheckoutId: requiredAbacatePayCheckoutId,
  checkoutUrl: requiredHttpsUrl,
  abacatePayCustomerId: requiredString('short'),
  managedProfiles: z.int().positive(),
  devMode: z.boolean(),
});
const RecordPendingSubscriptionMutationReturnsSchema = documentId('billingSubscriptions');
type RecordPendingSubscriptionResult = z.infer<
  typeof RecordPendingSubscriptionMutationReturnsSchema
>;

/**
 * Writes the `pending` row behind a checkout the provider just opened. One open subscription per
 * organization: the same checkout returns its row, a `bill_` a cancelled row owns is a `conflict`
 * (a second row under it would make `by_checkout` non-unique), and a different one while another
 * is open is a `conflict` — cancel first.
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
 * subscription checkout (a new `externalId` per attempt, `org-<id>-<n>`, so a repeat after a
 * cancel never hands back the dead `bill_`), and records the `pending` row. A pending checkout
 * is handed back as is — `cancelPanelSubscription` ends it so a different quantity can open.
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
    const open = await ctx.runQuery(internal.billing.getOpenPanelSubscription, {
      organizationId: args.organizationId,
    });
    if (open?.subscription.status === 'active') throw appError({ code: 'conflict' });
    if (open?.subscription.status === 'pending') {
      return {
        billingSubscriptionId: open.billingSubscriptionId,
        checkoutUrl: open.subscription.checkoutUrl,
        reusedPendingCheckout: true,
      };
    }
    const subscriptionCount = await ctx.runQuery(internal.billing.countBillingSubscriptions, {
      organizationId: args.organizationId,
    });
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
      externalId: `org-${args.organizationId}-${subscriptionCount + 1}`,
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
    const now = Date.now();
    await ctx.db.replace(billingSubscriptionId, {
      ...BillingSubscriptionIdentityFields.parse(row),
      updatedAt: now,
      status: 'cancelled',
      abacatePaySubscriptionId: row.status === 'active' ? row.abacatePaySubscriptionId : null,
      activatedAt: row.status === 'active' ? row.activatedAt : null,
      cancelledAt: now,
      cancelledDueTo,
    });
    return null;
  },
});

const CancelPanelSubscriptionActionArgsSchema = z.object({
  organizationId: documentId('organizations'),
});
const CancelPanelSubscriptionActionReturnsSchema = z.literal(true);
type CancelPanelSubscriptionResult = z.infer<typeof CancelPanelSubscriptionActionReturnsSchema>;

/**
 * Ends the organization's open subscription: `cancelPolicy: NOW` on an active one, deleting the
 * unpaid `bill_...` on a pending one (the provider emits no event for an expired checkout, so a
 * pending row would otherwise stay open forever). There is no un-cancel: a new panel starts
 * from a new checkout.
 */
export const cancelPanelSubscription = internalZodAction({
  args: CancelPanelSubscriptionActionArgsSchema,
  returns: CancelPanelSubscriptionActionReturnsSchema,
  handler: async (ctx, { organizationId }): Promise<CancelPanelSubscriptionResult> => {
    const apiKey = requiredEnv('ABACATE_PAY_API_KEY');
    const open = await ctx.runQuery(internal.billing.getOpenPanelSubscription, {
      organizationId,
    });
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
    const open = await ctx.runQuery(internal.billing.getOpenPanelSubscription, {
      organizationId,
    });
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

const RecordAbacatePayDeliveryMutationArgsSchema = z.object({
  deliveryId: requiredString('short'),
  event: requiredString('short'),
  devMode: z.boolean(),
  abacatePaySubscriptionId: nullableAbacatePaySubscriptionId,
  abacatePayCheckoutId: nullableAbacatePayCheckoutId,
  amountInCents: nullableAmountInCents,
  method: nullablePaymentMethod,
  pendingUpdateId: nullableString('short'),
  planChangeStatus: nullableString('short'),
  quantity: z.int().positive().nullable(),
  newAmountInCents: nullableAmountInCents,
  cancelledDueTo: nullableCancellationReason,
  /** `true` when the delivery carried no usable ids: it is terminal, nothing can re-run it. */
  unparsed: z.boolean().optional(),
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
 * so AbacatePay's retries never apply twice (the inbox's dedupe key). An `unparsed` one is
 * stored already resolved — without the raw body it can never be re-run.
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
    const { unparsed, ...delivery } = args;
    const now = Date.now();
    const billingWebhookDeliveryId = await ctx.db.insert('billingWebhookDeliveries', {
      ...delivery,
      billingSubscriptionId: null,
      receivedAt: now,
      processedAt: unparsed === true ? now : null,
      outcome: unparsed === true ? 'unparsed' : null,
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
 * Applies one stored delivery to its `billingSubscriptions` row and marks it processed — the
 * shared body of `processAbacatePayDelivery` and `reprocessUnprocessedDeliveries`. Events may
 * arrive out of order, so the row's status decides: `cancelled` is terminal (a late event is
 * `superseded`), and a `plan_changed` still `PENDING` records the asked quantity while one
 * without the request fields is the applied change.
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
      } else {
        await ctx.db.patch(row._id, {
          updatedAt: now,
          managedProfiles: row.pendingManagedProfiles ?? delivery.quantity ?? row.managedProfiles,
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
      await ctx.db.replace(row._id, {
        ...BillingSubscriptionIdentityFields.parse(row),
        updatedAt: now,
        status: 'cancelled',
        abacatePaySubscriptionId:
          delivery.abacatePaySubscriptionId ??
          (row.status === 'active' ? row.abacatePaySubscriptionId : null),
        activatedAt: row.status === 'active' ? row.activatedAt : null,
        cancelledAt: now,
        cancelledDueTo: delivery.cancelledDueTo,
      });
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
  remaining: z.number(),
});
type ReprocessUnprocessedDeliveriesResult = z.infer<
  typeof ReprocessUnprocessedDeliveriesMutationReturnsSchema
>;

/**
 * Re-runs deliveries a scheduled process never finished (`processedAt` still null), a bounded
 * batch at a time so a by-hand run stays cheap:
 * `pnpm exec convex run billing:reprocessUnprocessedDeliveries '{}'`
 */
export const reprocessUnprocessedDeliveries = internalZodMutation({
  args: ReprocessUnprocessedDeliveriesMutationArgsSchema,
  returns: ReprocessUnprocessedDeliveriesMutationReturnsSchema,
  handler: async (ctx, { limit }): Promise<ReprocessUnprocessedDeliveriesResult> => {
    const stranded = await ctx.db
      .query('billingWebhookDeliveries')
      .withIndex('by_processed', (index) => index.eq('processedAt', null))
      .collect();
    for (const delivery of stranded.slice(0, limit ?? reprocessBatchCeiling)) {
      await applyAbacatePayDelivery(ctx, delivery._id);
    }
    const stillStranded = await ctx.db
      .query('billingWebhookDeliveries')
      .withIndex('by_processed', (index) => index.eq('processedAt', null))
      .collect();
    return {
      reprocessed: stranded.length - stillStranded.length,
      remaining: stillStranded.length,
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
  const fields = parseAbacatePayEventData(envelope.data);
  const unparsed = fields.abacatePaySubscriptionId === null && fields.abacatePayCheckoutId === null;
  if (unparsed) {
    console.warn(
      `AbacatePay delivery ${envelope.id} (${envelope.event}) carried no usable ids`,
      fields.issuePaths,
    );
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
    unparsed,
  });
  if (record.outcome === 'stored' && !unparsed) {
    await ctx.scheduler.runAfter(0, internal.billing.processAbacatePayDelivery, {
      billingWebhookDeliveryId: record.billingWebhookDeliveryId,
    });
  }
  return new Response('OK', { status: 200 });
});
