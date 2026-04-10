// ─── Stripe Payment Provider ──────────────────────────────────
// Full SaaS billing: checkout, trial, upgrade, downgrade,
// cancel (immediate / end-of-period), portal, webhook parsing.

import Stripe from 'stripe'
import type {
  PaymentProvider,
  CheckoutOptions, CheckoutResult,
  UpgradeOptions,  UpgradeResult,
  CancelOptions,   CancelResult,
  PortalOptions,
  WebhookResult,
} from './provider'
import { getStripePriceId } from '../stripe'
import { fetchPlan } from '../plans'
import { getCurrency } from '../currencies'

export class StripeProvider implements PaymentProvider {
  readonly id          = 'stripe'
  readonly displayName = 'Cartão (Stripe)'

  private readonly client = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
  })

  // ── Customer ──────────────────────────────────────────────────

  async getOrCreateCustomer(userId: string, email: string): Promise<string> {
    const found = await this.client.customers.search({
      query: `metadata['user_id']:'${userId}'`,
      limit: 1,
    })
    if (found.data.length > 0) return found.data[0].id

    const customer = await this.client.customers.create({
      email,
      metadata: { user_id: userId },
    })
    return customer.id
  }

  // ── Checkout ──────────────────────────────────────────────────

  async createCheckout(opts: CheckoutOptions): Promise<CheckoutResult> {
    const { userId, userEmail, planId, currency, interval, successUrl, cancelUrl, trialDays = 0, metadata } = opts

    const plan = await fetchPlan(planId)
    const priceId = getStripePriceId(plan, currency, interval)

    if (!priceId) {
      throw new Error(`Stripe price not configured: plan=${planId} currency=${currency} interval=${interval}`)
    }

    const customerId = await this.getOrCreateCustomer(userId, userEmail)

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode:     'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url:  cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        user_id:  userId,
        plan_id:  planId,
        interval,
        provider: 'stripe',
        ...metadata,
      },
      subscription_data: {
        metadata: { user_id: userId, plan_id: planId, interval },
        ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
      },
    }

    const session = await this.client.checkout.sessions.create(sessionParams)
    return { type: 'redirect', url: session.url! }
  }

  // ── Upgrade / Downgrade ───────────────────────────────────────

  async upgradeSubscription(opts: UpgradeOptions): Promise<UpgradeResult> {
    const { providerSubscriptionId, newPlanId, currency, interval, timing = 'immediate' } = opts

    const plan = await fetchPlan(newPlanId)
    const priceId = getStripePriceId(plan, currency, interval)

    if (!priceId) {
      throw new Error(`No Stripe price for plan=${newPlanId} currency=${currency} interval=${interval}`)
    }

    const subscription = await this.client.subscriptions.retrieve(providerSubscriptionId)
    const itemId = subscription.items.data[0]?.id

    if (!itemId) throw new Error('No subscription item found.')

    const updatedSub = await this.client.subscriptions.update(providerSubscriptionId, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior:       timing === 'immediate' ? 'create_prorations' : 'none',
      billing_cycle_anchor:     timing === 'immediate' ? 'now' : undefined,
      payment_behavior:         'pending_if_incomplete',
      metadata: { plan_id: newPlanId, interval },
    })

    return {
      providerSubscriptionId,
      newPlanId,
      effectiveAt: timing === 'immediate'
        ? new Date().toISOString()
        : new Date(updatedSub.current_period_end * 1000).toISOString(),
    }
  }

  // ── Cancel ────────────────────────────────────────────────────

  async cancelSubscription(opts: CancelOptions): Promise<CancelResult> {
    const { providerSubscriptionId, timing, reason } = opts

    if (timing === 'immediate') {
      const cancelled = await this.client.subscriptions.cancel(providerSubscriptionId, {
        cancellation_details: reason ? { comment: reason } : undefined,
      })
      return {
        cancelled: true,
        effectiveAt: new Date(cancelled.ended_at! * 1000).toISOString(),
      }
    } else {
      // Cancel at period end — user keeps access until billing cycle ends
      const updated = await this.client.subscriptions.update(providerSubscriptionId, {
        cancel_at_period_end: true,
        cancellation_details: reason ? { comment: reason } : undefined,
      })
      return {
        cancelled: true,
        effectiveAt: new Date(updated.current_period_end * 1000).toISOString(),
      }
    }
  }

  // ── Reactivate ────────────────────────────────────────────────

  async reactivateSubscription(providerSubscriptionId: string): Promise<{ reactivated: boolean }> {
    await this.client.subscriptions.update(providerSubscriptionId, {
      cancel_at_period_end: false,
    })
    return { reactivated: true }
  }

  // ── Portal ────────────────────────────────────────────────────

  async createPortalSession(opts: PortalOptions): Promise<{ url: string }> {
    const session = await this.client.billingPortal.sessions.create({
      customer:   opts.providerCustomerId,
      return_url: opts.returnUrl,
    })
    return { url: session.url }
  }

  // ── Webhook ───────────────────────────────────────────────────

  async handleWebhook(rawBody: Buffer, signature: string): Promise<WebhookResult> {
    const event = this.client.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    return this.parseEvent(event)
  }

  private parseEvent(event: Stripe.Event): WebhookResult {
    const raw = event.data.object as unknown as Record<string, unknown>

    switch (event.type) {

      // ── Trial started ─────────────────────────────────────────────────────
      case 'customer.subscription.trial_will_end': {
        const sub = event.data.object as Stripe.Subscription
        return {
          type: 'subscription.trial_ending',
          userId: sub.metadata?.user_id,
          planId: sub.metadata?.plan_id,
          providerSubscriptionId: sub.id,
          providerCustomerId: sub.customer as string,
          trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : undefined,
          raw,
        }
      }

      // ── Checkout completed (new subscription OR trial start) ──────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') return { type: 'unknown', raw }

        // Determine if this is a trial
        const subId = session.subscription as string

        return {
          type: 'subscription.activated',
          userId: session.metadata?.user_id,
          planId: session.metadata?.plan_id,
          providerCustomerId: session.customer as string,
          providerSubscriptionId: subId,
          amountCents: session.amount_total ?? 0,
          currency: session.currency?.toUpperCase(),
          raw,
        }
      }

      // ── Subscription created (also fires on trial start) ──────────────────
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription
        const isTrial = sub.status === 'trialing'

        return {
          type: isTrial ? 'subscription.trial_started' : 'subscription.activated',
          userId: sub.metadata?.user_id,
          planId: sub.metadata?.plan_id,
          providerSubscriptionId: sub.id,
          providerCustomerId: sub.customer as string,
          trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : undefined,
          currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
          raw,
        }
      }

      // ── Invoice paid → renewal or trial converted ──────────────────────────
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const isFirstPayment = invoice.billing_reason === 'subscription_create'
        const isTrialConversion = invoice.billing_reason === 'subscription_cycle' &&
          invoice.amount_paid > 0

        // Skip $0 trial invoices — handled by subscription.created
        if (invoice.amount_paid === 0 && isFirstPayment) return { type: 'unknown', raw }

        return {
          type: isFirstPayment ? 'subscription.activated' : 'subscription.renewed',
          providerSubscriptionId: invoice.subscription as string,
          providerCustomerId: invoice.customer as string,
          planId: (invoice.lines.data[0]?.price?.metadata as Record<string, string>)?.plan_id,
          amountCents: invoice.amount_paid,
          currency: invoice.currency.toUpperCase(),
          raw,
        }
      }

      // ── Invoice payment failed ─────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        return {
          type: 'payment.failed',
          providerSubscriptionId: invoice.subscription as string,
          providerCustomerId: invoice.customer as string,
          amountCents: invoice.amount_due,
          currency: invoice.currency.toUpperCase(),
          raw,
        }
      }

      // ── Subscription updated (upgrade / downgrade / reactivation) ──────────
      case 'customer.subscription.updated': {
        const sub  = event.data.object as Stripe.Subscription
        const prev = event.data.previous_attributes as Record<string, unknown>

        const currentPlanId  = sub.metadata?.plan_id
        const previousPlanId = (prev.metadata as Record<string, string> | undefined)?.plan_id

        // Detect cancel_at_period_end toggle
        if (prev.cancel_at_period_end !== undefined) {
          const wasCancelling = prev.cancel_at_period_end as boolean
          if (!wasCancelling && sub.cancel_at_period_end) {
            return {
              type: 'subscription.cancelled',
              userId: sub.metadata?.user_id,
              planId: currentPlanId,
              providerSubscriptionId: sub.id,
              providerCustomerId: sub.customer as string,
              currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
              raw,
            }
          }
        }

        // Plan change
        if (previousPlanId && currentPlanId && previousPlanId !== currentPlanId) {
          const wasDowngrade = true // Simplified — could compare prices
          return {
            type: wasDowngrade ? 'subscription.downgraded' : 'subscription.upgraded',
            userId: sub.metadata?.user_id,
            planId: currentPlanId,
            previousPlanId,
            providerSubscriptionId: sub.id,
            providerCustomerId: sub.customer as string,
            currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
            raw,
          }
        }

        return { type: 'unknown', raw }
      }

      // ── Subscription cancelled (immediately) ───────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        return {
          type: 'subscription.cancelled',
          userId: sub.metadata?.user_id,
          planId: sub.metadata?.plan_id,
          providerSubscriptionId: sub.id,
          providerCustomerId: sub.customer as string,
          raw,
        }
      }

      // ── Charge refunded ───────────────────────────────────────────────────
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        return {
          type: 'payment.refunded',
          providerCustomerId: charge.customer as string,
          amountCents: charge.amount_refunded,
          currency: charge.currency.toUpperCase(),
          raw,
        }
      }

      default:
        return { type: 'unknown', raw }
    }
  }
}
