a // ─── Payment Provider Registry ────────────────────────────────
// Stripe is the active provider. Local methods (MBWay, Multibanco)
// are stub-registered but flagged inactive until enabled via env.
//
// To add a new provider:
//   1. Implement PaymentProvider interface in a new file
//   2. Import and add it to `buildRegistry()` below
//   3. Set the env flag (ENABLE_MBWAY=true, etc.)
// No other files need to change.

import type { PaymentProvider } from './provider'
import { StripeProvider }       from './stripe-provider'

// Stubs — import when implementing
// import { MBWayProvider }       from './mbway-provider'
// import { MultibancoProvider }   from './multibanco-provider'

// ── Registry ──────────────────────────────────────────────────

function buildRegistry(): Map<string, PaymentProvider> {
  const providers: PaymentProvider[] = [
    new StripeProvider(),
    // Uncomment to activate local methods:
    // ...(process.env.ENABLE_MBWAY      === 'true' ? [new MBWayProvider()]      : []),
    // ...(process.env.ENABLE_MULTIBANCO === 'true' ? [new MultibancoProvider()]  : []),
  ]
  return new Map(providers.map((p) => [p.id, p]))
}

const registry = buildRegistry()

// ── Lookups ───────────────────────────────────────────────────

/**
 * Returns a provider by ID. Falls back to 'stripe' if the requested
 * provider is not active — prevents runtime errors when a method is
 * configured client-side but disabled server-side.
 */
export function getProvider(id: string): PaymentProvider {
  return registry.get(id) ?? registry.get('stripe')!
}

/**
 * Resolves a frontend `paymentMethod` string to a provider ID.
 * If the mapped provider is not active, silently falls back to Stripe.
 */
export function resolveProvider(paymentMethod: string): string {
  const mapping: Record<string, string> = {
    card:       'stripe',
    stripe:     'stripe',
    mbway:      'mbway',
    multibanco: 'multibanco',
  }
  const id = mapping[paymentMethod.toLowerCase()] ?? 'stripe'
  return registry.has(id) ? id : 'stripe'
}

/**
 * Returns all known providers with their active status.
 * Used by GET /billing/providers to inform the frontend
 * which payment methods to show.
 */
export function listProviders(): Array<{
  id: string
  displayName: string
  active: boolean
  currencies?: string[]
}> {
  return [
    {
      id:          'stripe',
      displayName: 'Cartão de crédito / débito',
      active:      true,
      currencies:  ['EUR', 'USD', 'BRL'],
    },
    {
      id:          'mbway',
      displayName: 'MBWay',
      active:      process.env.ENABLE_MBWAY === 'true',
      currencies:  ['EUR'],
    },
    {
      id:          'multibanco',
      displayName: 'Multibanco',
      active:      process.env.ENABLE_MULTIBANCO === 'true',
      currencies:  ['EUR'],
    },
  ]
}

export type { PaymentProvider, CheckoutOptions, CheckoutResult, WebhookResult, BillingInterval } from './provider'
