/**
 * MBWay Payment Provider
 *
 * MBWay is a Portuguese mobile payment method.
 * Implementation options:
 *   A) Via Stripe (payment_method_types: ['link'] + MBWay through Stripe's PMs for Portugal)
 *   B) Direct integration with SIBS API (MB WAY Checkout API)
 *   C) Via aggregators: Easypay, Ifthenpay, Eupago
 *
 * This stub models option C (aggregator pattern) with a clean interface.
 * Replace the TODO sections with the real aggregator SDK calls.
 *
 * Activation:
 *   Set MBWAY_API_KEY and MBWAY_ENTITY_KEY environment variables.
 *   Set ENABLE_MBWAY=true to enable this provider in the registry.
 */

import type {
  PaymentProvider, CheckoutOptions, CheckoutResult, WebhookResult,
} from './provider'
import { PLANS } from '../stripe'
import { convertFromBase } from '../exchange-rates'

const ENABLED = process.env.ENABLE_MBWAY === 'true'

export class MBWayProvider implements PaymentProvider {
  readonly id = 'mbway'
  readonly displayName = 'MBWay'

  async getOrCreateCustomer(userId: string, _email: string): Promise<string> {
    // MBWay identifies customers by phone number, not by a persistent customer object.
    // Return userId as the internal reference.
    return userId
  }

  async createCheckout(opts: CheckoutOptions): Promise<CheckoutResult> {
    if (!ENABLED) {
      return { type: 'pending', message: 'MBWay não está disponível neste momento.' }
    }

    const { planId, currency, userId, metadata } = opts
    const phone = (opts as CheckoutOptions & { phone?: string }).phone

    if (!phone) throw new Error('MBWay requires a phone number (opts.phone)')

    const plan = PLANS[planId]
    if (!plan || plan.priceEurCents === 0) throw new Error(`Invalid plan: ${planId}`)

    const amountCents = await convertFromBase(plan.priceEurCents, currency)

    // ─── TODO: Replace with real aggregator call ──────────────────────────────
    // Example using Easypay:
    //   const response = await easypay.createSinglePayment({
    //     type: 'mbway',
    //     phone,
    //     amount: amountCents / 100,
    //     currency,
    //     reference: `ETHY-${planId}-${userId}`,
    //   })
    // ─────────────────────────────────────────────────────────────────────────

    console.warn('[MBWay] createCheckout called but not implemented. Returning pending.')
    return {
      type: 'pending',
      message: `Pedido MBWay enviado para ${phone}. Aceite o pagamento na sua app MBWay. Valor: ${(amountCents / 100).toFixed(2)} ${currency}`,
    }
  }

  async handleWebhook(rawBody: Buffer, _signature: string): Promise<WebhookResult> {
    if (!ENABLED) return { type: 'unknown', raw: {} }

    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(rawBody.toString())
    } catch {
      throw new Error('Invalid MBWay webhook payload')
    }

    // ─── TODO: Verify signature with aggregator's HMAC / token ───────────────
    // const expectedSig = hmac(process.env.MBWAY_WEBHOOK_SECRET!, rawBody)
    // if (expectedSig !== _signature) throw new Error('Invalid MBWay signature')
    // ─────────────────────────────────────────────────────────────────────────

    // ─── TODO: Map aggregator event to WebhookResult ─────────────────────────
    // Each aggregator has different event shapes. Map them here.
    // Example: Easypay sends { event: 'payment_ok', amount, user_id, plan_id }
    // ─────────────────────────────────────────────────────────────────────────

    console.warn('[MBWay] handleWebhook: unimplemented', payload)
    return { type: 'unknown', raw: payload }
  }
}
