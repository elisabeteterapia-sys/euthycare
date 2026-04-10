/**
 * Multibanco Payment Provider
 *
 * Multibanco is a Portuguese ATM payment network.
 * The user receives an Entity + Reference + Amount and pays at any ATM or online banking.
 *
 * Implementation options:
 *   A) Via Stripe (payment_method_types: ['multibanco']) — Stripe generates the reference
 *   B) Via SIBS MB-CHECKOUT API directly
 *   C) Via aggregators: Easypay, Ifthenpay, Eupago
 *
 * This stub models option A (Stripe) for subscriptions and option C for one-time payments.
 *
 * Activation:
 *   Set ENABLE_MULTIBANCO=true to enable in the registry.
 *   For Stripe: ensure your Stripe account is activated for Multibanco (Portugal accounts).
 *   For aggregators: set MULTIBANCO_ENTITY and MULTIBANCO_API_KEY.
 *
 * Note: Multibanco is a one-time payment method — it does not support recurring subscriptions
 * natively. The recommended pattern is: charge via Multibanco then grant access for the period,
 * and notify the user when renewal is due.
 */

import Stripe from 'stripe'
import type {
  PaymentProvider, CheckoutOptions, CheckoutResult, WebhookResult,
} from './provider'
import { PLANS } from '../stripe'
import { convertFromBase } from '../exchange-rates'
import { getCurrency } from '../currencies'

const ENABLED = process.env.ENABLE_MULTIBANCO === 'true'

export class MultibancoProvider implements PaymentProvider {
  readonly id = 'multibanco'
  readonly displayName = 'Multibanco'

  private stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
  })

  async getOrCreateCustomer(userId: string, email: string): Promise<string> {
    const existing = await this.stripeClient.customers.search({
      query: `metadata['user_id']:'${userId}'`,
      limit: 1,
    })
    if (existing.data.length > 0) return existing.data[0].id

    const customer = await this.stripeClient.customers.create({
      email,
      metadata: { user_id: userId },
    })
    return customer.id
  }

  async createCheckout(opts: CheckoutOptions): Promise<CheckoutResult> {
    if (!ENABLED) {
      return { type: 'pending', message: 'Multibanco não está disponível neste momento.' }
    }

    const { planId, currency, userId, userEmail } = opts
    const plan = PLANS[planId]
    if (!plan || plan.priceEurCents === 0) throw new Error(`Invalid plan: ${planId}`)

    // Multibanco only supports EUR
    const amountCents = await convertFromBase(plan.priceEurCents, 'EUR')
    const customerId = await this.getOrCreateCustomer(userId, userEmail)

    // Create a PaymentIntent with Multibanco payment method via Stripe
    // This returns a voucher (entity + reference)
    const paymentIntent = await this.stripeClient.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      customer: customerId,
      payment_method_types: ['multibanco'],
      metadata: {
        user_id: userId,
        plan_id: planId,
        provider: 'multibanco',
      },
    })

    // Confirm to get the Multibanco reference
    const confirmed = await this.stripeClient.paymentIntents.confirm(paymentIntent.id, {
      payment_method_data: { type: 'multibanco' },
      return_url: opts.successUrl,
    })

    const nextAction = confirmed.next_action as Stripe.PaymentIntent.NextAction & {
      multibanco_display_details?: { entity: string; reference: string; expires_at: number }
    }

    if (nextAction?.multibanco_display_details) {
      const { entity, reference, expires_at } = nextAction.multibanco_display_details
      return {
        type: 'reference',
        entity,
        reference,
        amount: amountCents / 100,
        currency: 'EUR',
        expiresAt: new Date(expires_at * 1000).toISOString(),
      }
    }

    // ─── Fallback: aggregator-based Multibanco ────────────────────────────────
    // If Stripe Multibanco is not available, use an aggregator (Easypay, Ifthenpay, etc.)
    // TODO: implement aggregator call here
    // ─────────────────────────────────────────────────────────────────────────

    return {
      type: 'pending',
      message: 'Referência Multibanco sendo gerada. Por favor, aguarde.',
    }
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<WebhookResult> {
    if (!ENABLED) return { type: 'unknown', raw: {} }

    let event: Stripe.Event
    try {
      event = this.stripeClient.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch {
      throw new Error('Invalid Multibanco webhook signature')
    }

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent
      if (pi.payment_method_types?.includes('multibanco')) {
        return {
          type: 'subscription.activated',
          userId: pi.metadata.user_id,
          planId: pi.metadata.plan_id,
          providerCustomerId: pi.customer as string,
          amountCents: pi.amount_received,
          currency: pi.currency.toUpperCase(),
          raw: pi,
        }
      }
    }

    return { type: 'unknown', raw: event.data.object as object }
  }
}
