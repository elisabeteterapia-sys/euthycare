import Stripe from 'stripe'
import { getCurrency, SUPPORTED_CURRENCY_CODES } from './currencies'
import { getExchangeRates } from './exchange-rates'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

// ── Re-export plan types & helpers from lib/plans ─────────────
// Stripe-specific operations (pricing, checkout) continue here.

export type { Plan, PlanTipo, IaNivel, BackupTipo, PlanPermissions } from './plans'
export {
  fetchPlans,
  fetchPlan,
  fetchTerapeutaPlans,
  getPlanPermissions,
  checkTherapistLimit,
  requiresCommercialContact,
} from './plans'

export type BillingInterval = 'month' | 'year'

// ── Backwards-compat price map ────────────────────────────────
// Kept for webhook handlers that pre-date the DB plans table.
export const PLANS: Record<string, { priceEurCents: number }> = {
  essencial:    { priceEurCents: 1900 },
  profissional: { priceEurCents: 3900 },
  premium:      { priceEurCents: 6900 },
  clinica:      { priceEurCents: 14900 },
  enterprise:   { priceEurCents: 0 },
}

// ── Price ID lookup ───────────────────────────────────────────

import type { Plan } from './plans'

/**
 * Retorna o Stripe Price ID para um plano + moeda + intervalo.
 * Prioridade: campo na tabela plans → variável de ambiente → null.
 */
export function getStripePriceId(
  plan: Plan,
  currency: string,
  interval: BillingInterval = 'month'
): string | null {
  const cur = currency.toLowerCase() as 'eur' | 'usd' | 'brl'
  const col = `stripe_price_${interval === 'month' ? 'mensal' : 'anual'}_${cur}` as keyof Plan
  const fromDb = plan[col] as string | null

  const envKey = `STRIPE_PRICE_${plan.id.toUpperCase()}_${interval.toUpperCase()}_${currency.toUpperCase()}`
  const envFallback = `STRIPE_PRICE_${plan.id.toUpperCase()}_${currency.toUpperCase()}`

  return fromDb ?? process.env[envKey] ?? process.env[envFallback] ?? null
}

// ── Price display ─────────────────────────────────────────────

export interface PriceDisplay {
  amountCents: number
  currency: string
  formatted: string
  annualFormatted: string
  savingsCents: number
  discountPct: number
}

export async function getPriceDisplay(
  plan: Plan,
  currency: string
): Promise<PriceDisplay> {
  const rates = await getExchangeRates()
  const rate = rates[currency.toUpperCase()] ?? 1
  const curr = getCurrency(currency)

  const monthlyEurCents = Math.round(plan.preco_mensal_eur * 100)
  const annualEurCents  = Math.round(plan.preco_anual_eur  * 100)

  const monthlyLocalCents = Math.round(monthlyEurCents * rate)
  const annualLocalCents  = Math.round(annualEurCents  * rate)

  const twelveMonths = monthlyLocalCents * 12
  const savingsCents = Math.max(0, twelveMonths - annualLocalCents)
  const discountPct  = monthlyLocalCents > 0
    ? Math.round((savingsCents / twelveMonths) * 100)
    : 0

  const fmt = (cents: number) =>
    new Intl.NumberFormat(curr.locale, {
      style: 'currency',
      currency: curr.code,
      minimumFractionDigits: 2,
    }).format(cents / 100)

  return {
    amountCents:     monthlyLocalCents,
    currency:        curr.code,
    formatted:       fmt(monthlyLocalCents),
    annualFormatted: fmt(annualLocalCents),
    savingsCents,
    discountPct,
  }
}

/** Returns all active plans with prices converted to the requested currency. */
export async function getPlansForCurrency(currency: string) {
  const { fetchPlans: _fetchPlans } = await import('./plans')
  const plans = await _fetchPlans()
  const prices = await Promise.all(plans.map((p) => getPriceDisplay(p, currency)))

  return plans.map((plan, i) => ({
    ...plan,
    pricing: prices[i],
  }))
}

// ── Stripe Checkout ───────────────────────────────────────────

export async function createCheckoutSession(opts: {
  customerId?: string
  customerEmail?: string
  planId: string
  currency: string
  interval?: BillingInterval
  therapistCount?: number
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}): Promise<Stripe.Checkout.Session> {
  const {
    customerId, customerEmail, planId, currency,
    interval = 'month', therapistCount = 1, successUrl, cancelUrl, metadata,
  } = opts

  const { fetchPlan: _fetchPlan } = await import('./plans')
  const plan = await _fetchPlan(planId)
  const priceId = getStripePriceId(plan, currency, interval)

  if (!priceId) {
    throw new Error(`No Stripe price configured for plan=${planId} currency=${currency} interval=${interval}`)
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: therapistCount }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { ...metadata, therapist_count: String(therapistCount) },
    currency: getCurrency(currency).stripeCurrency,
    allow_promotion_codes: true,
  }

  if (customerId) sessionParams.customer = customerId
  else if (customerEmail) sessionParams.customer_email = customerEmail

  return stripe.checkout.sessions.create(sessionParams)
}

// ── Customer helpers ──────────────────────────────────────────

export async function getOrCreateCustomer(userId: string, email: string): Promise<string> {
  const existing = await stripe.customers.search({
    query: `metadata['user_id']:'${userId}'`,
    limit: 1,
  })
  if (existing.data.length > 0) return existing.data[0].id

  const customer = await stripe.customers.create({
    email,
    metadata: { user_id: userId },
  })
  return customer.id
}

export function constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET!)
}

export { SUPPORTED_CURRENCY_CODES }
