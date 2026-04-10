// ─── Payment Provider Abstraction ────────────────────────────────────────────
// To add a new payment method: implement PaymentProvider and register in index.ts.
// No other files need to change.

// ── Checkout ──────────────────────────────────────────────────

export type BillingInterval = 'month' | 'year'

export interface CheckoutOptions {
  userId: string
  userEmail: string
  planId: string
  currency: string                    // 'EUR' | 'USD' | 'BRL'
  interval: BillingInterval           // 'month' | 'year'
  successUrl: string
  cancelUrl: string
  // Trial
  trialDays?: number                  // 0 = no trial
  // Metadata passed through to webhook
  metadata?: Record<string, string>
}

export type CheckoutResult =
  | { type: 'redirect'; url: string }                                                      // Stripe Checkout
  | { type: 'reference'; entity: string; reference: string; amount: number; currency: string; expiresAt: string }  // Multibanco
  | { type: 'pending'; message: string; reference?: string }                               // MBWay polling

// ── Subscription management ───────────────────────────────────

export interface UpgradeOptions {
  providerSubscriptionId: string
  newPlanId: string
  currency: string
  interval: BillingInterval
  /** 'immediate' = prorate now; 'next_cycle' = switch at renewal */
  timing?: 'immediate' | 'next_cycle'
}

export interface UpgradeResult {
  providerSubscriptionId: string
  newPlanId: string
  effectiveAt: string   // ISO date
  proratedAmountCents?: number
}

export interface CancelOptions {
  providerSubscriptionId: string
  /** 'immediate' = cancel now; 'end_of_period' = cancel at billing cycle end */
  timing: 'immediate' | 'end_of_period'
  reason?: string
}

export interface CancelResult {
  cancelled: boolean
  effectiveAt: string
}

// ── Portal ────────────────────────────────────────────────────

export interface PortalOptions {
  providerCustomerId: string
  returnUrl: string
}

// ── Webhook ───────────────────────────────────────────────────

export type WebhookEventType =
  | 'subscription.trial_started'
  | 'subscription.trial_ending'       // trial will end in 3 days
  | 'subscription.activated'          // trial converted OR paid started
  | 'subscription.renewed'
  | 'subscription.upgraded'
  | 'subscription.downgraded'
  | 'subscription.cancelled'
  | 'subscription.paused'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.refunded'
  | 'unknown'

export interface WebhookResult {
  type: WebhookEventType
  userId?: string
  planId?: string
  previousPlanId?: string
  providerCustomerId?: string
  providerSubscriptionId?: string
  amountCents?: number
  currency?: string
  trialEndsAt?: string
  currentPeriodEnd?: string
  raw: object
}

// ── Provider interface ────────────────────────────────────────

export interface PaymentProvider {
  /** Unique identifier, e.g. 'stripe', 'mbway', 'multibanco' */
  readonly id: string
  readonly displayName: string

  // ── Core ──────────────────────────────────────────────────────

  /** Initiates a new subscription checkout */
  createCheckout(opts: CheckoutOptions): Promise<CheckoutResult>

  /** Verifies and parses an incoming webhook payload */
  handleWebhook(rawBody: Buffer, signature: string): Promise<WebhookResult>

  /** Creates or retrieves the provider-side customer ID for a user */
  getOrCreateCustomer(userId: string, email: string): Promise<string>

  // ── Optional — not all providers support all operations ──────

  /** Self-service subscription management portal */
  createPortalSession?(opts: PortalOptions): Promise<{ url: string }>

  /** Upgrade or downgrade to a different plan */
  upgradeSubscription?(opts: UpgradeOptions): Promise<UpgradeResult>

  /** Cancel a subscription (immediate or at period end) */
  cancelSubscription?(opts: CancelOptions): Promise<CancelResult>

  /** Reactivate a previously cancelled subscription (before period ends) */
  reactivateSubscription?(providerSubscriptionId: string): Promise<{ reactivated: boolean }>
}
