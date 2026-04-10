// ─── Billing Routes ───────────────────────────────────────────
// Stripe-first SaaS billing: checkout, trial, upgrade, downgrade,
// cancel (immediate / end-of-period), webhook, portal.
//
// Endpoints:
//   GET  /billing/providers
//   GET  /billing/plans?currency=EUR&tipo=all&interval=month
//   GET  /billing/subscription
//   POST /billing/checkout
//   POST /billing/upgrade
//   POST /billing/cancel
//   POST /billing/reactivate
//   GET  /billing/portal
//   POST /billing/webhook/stripe
//   POST /billing/webhook/mbway        (future, env-gated)
//   POST /billing/webhook/multibanco   (future, env-gated)

import { Router, Request, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { getProvider, resolveProvider, listProviders } from '../lib/payments/index'
import { getPlansForCurrency } from '../lib/stripe'
import { fetchPlan, getPlanPermissions, requiresCommercialContact } from '../lib/plans'
import { getCurrency, CURRENCIES } from '../lib/currencies'
import { createChave, activateChave } from '../lib/chaves'
import { supabaseAdmin } from '../lib/supabase'

const router = Router()
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000'
const TRIAL_DAYS   = parseInt(process.env.TRIAL_DAYS ?? '30', 10)

// ─── Internal helpers ─────────────────────────────────────────

/** Fetches the Stripe subscription object for a user */
async function getUserSubscription(userId: string) {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('plan, stripe_customer_id, stripe_subscription_id, plan_expires_at, trial_ends_at, subscription_status, currency_preference, limite_terapeutas_custom')
    .eq('id', userId)
    .single()
  return data
}

/** Updates profile + logs the subscription event */
async function applySubscription(opts: {
  userId: string
  planId: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  status: 'trialing' | 'active' | 'cancelled' | 'past_due'
  trialEndsAt?: string | null
  currentPeriodEnd?: string | null
  event: string
  provider?: string
  amountCents?: number
  currency?: string
}) {
  const {
    userId, planId, stripeCustomerId, stripeSubscriptionId,
    status, trialEndsAt, currentPeriodEnd, event, provider = 'stripe',
    amountCents, currency,
  } = opts

  await supabaseAdmin
    .from('profiles')
    .update({
      plan:                     planId,
      stripe_customer_id:       stripeCustomerId,
      stripe_subscription_id:   stripeSubscriptionId,
      subscription_status:      status,
      plan_expires_at:          status === 'cancelled' ? currentPeriodEnd : null,
      trial_ends_at:            trialEndsAt ?? null,
      updated_at:               new Date().toISOString(),
    })
    .eq('id', userId)

  // Log to subscription_events
  await supabaseAdmin
    .from('subscription_events')
    .insert({
      user_id:                  userId,
      event_type:               event,
      plan_id:                  planId,
      provider,
      provider_subscription_id: stripeSubscriptionId,
      amount_cents:             amountCents,
      currency,
      metadata: { status, trial_ends_at: trialEndsAt, period_end: currentPeriodEnd },
    })
}

/** Creates and immediately activates a pos_pagamento chave for the user */
async function issueActivationKey(userId: string, planId: string, provider = 'stripe') {
  const chave = await createChave({
    tipo:      'pos_pagamento',
    planoId:   planId,
    validadeDias: null,   // never expires — tied to subscription
    criadoPor: provider,
  })
  await activateChave(chave.codigo, userId)
  return chave
}

// ─── Routes ───────────────────────────────────────────────────

// GET /billing/providers
router.get('/providers', (_req, res: Response) => {
  res.json(listProviders())
})

// GET /billing/plans?currency=EUR&tipo=all&interval=month
router.get('/plans', async (req: Request, res: Response) => {
  const currency    = ((req.query.currency as string) ?? 'EUR').toUpperCase()
  const tipoFilter  = (req.query.tipo as string) ?? 'all'
  const interval    = (req.query.interval as string) ?? 'month'
  const validCurrency = CURRENCIES[currency] ? currency : 'EUR'

  let plans = await getPlansForCurrency(validCurrency)

  if (tipoFilter !== 'all') {
    plans = plans.filter((p) => p.tipo === tipoFilter)
  }

  // Strip internal Stripe price columns
  const shaped = plans.map(({
    stripe_price_mensal_eur, stripe_price_mensal_usd, stripe_price_mensal_brl,
    stripe_price_anual_eur,  stripe_price_anual_usd,  stripe_price_anual_brl,
    ...rest
  }) => ({
    ...rest,
    // Convenience: selected interval pricing
    selectedPrice: interval === 'year'
      ? rest.pricing?.annualFormatted
      : rest.pricing?.formatted,
  }))

  const curr = getCurrency(validCurrency)

  res.json({
    currency: curr.code,
    symbol:   curr.symbol,
    interval,
    trialDays: TRIAL_DAYS,
    plans: shaped,
    grouped: {
      terapeuta:  shaped.filter((p) => p.tipo === 'terapeuta'),
      clinica:    shaped.filter((p) => p.tipo === 'clinica'),
      enterprise: shaped.filter((p) => p.tipo === 'enterprise'),
    },
  })
})

// GET /billing/subscription
router.get('/subscription', requireAuth, async (req: AuthRequest, res: Response) => {
  const profile = await getUserSubscription(req.user!.id)

  if (!profile) {
    res.status(404).json({ error: 'Perfil não encontrado.' })
    return
  }

  // Plan details + permissions
  let planDetails = null
  let permissions = null
  try {
    const plan = await fetchPlan(profile.plan)
    planDetails = {
      id:               plan.id,
      nome:             plan.nome,
      tipo:             plan.tipo,
      limite_terapeutas: profile.limite_terapeutas_custom ?? plan.limite_terapeutas,
      ia_nivel:         plan.ia_nivel,
      tem_backup:       plan.tem_backup,
      tipo_backup:      plan.tipo_backup,
      exportacao_total: plan.exportacao_total,
      preco_mensal_eur: plan.preco_mensal_eur,
      preco_anual_eur:  plan.preco_anual_eur,
    }
    permissions = getPlanPermissions(plan)
  } catch { /* plan not in DB — minimal response */ }

  // Trial state
  const isTrialing = profile.subscription_status === 'trialing'
  const trialEndsAt = profile.trial_ends_at
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000))
    : null

  // Active chave
  const { data: chave } = await supabaseAdmin
    .from('chaves_ativacao')
    .select('codigo, tipo, expirado_em, usado_em')
    .eq('usado_por_clinica_id', req.user!.id)
    .eq('usado', true)
    .order('usado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  res.json({
    plan:                  profile.plan,
    planDetails,
    permissions,
    subscriptionStatus:    profile.subscription_status ?? 'inactive',
    stripeCustomerId:      profile.stripe_customer_id,
    stripeSubscriptionId:  profile.stripe_subscription_id,
    currencyPreference:    profile.currency_preference ?? 'EUR',
    isTrialing,
    trialEndsAt,
    trialDaysLeft,
    planExpiresAt:         profile.plan_expires_at,
    activationKey:         chave ? {
      codigo:    chave.codigo,
      tipo:      chave.tipo,
      expiresAt: chave.expirado_em,
      usedAt:    chave.usado_em,
    } : null,
  })
})

// POST /billing/checkout
// Body: { planId, currency?, interval?, trialDays? }
router.post('/checkout', requireAuth, async (req: AuthRequest, res: Response) => {
  const {
    planId,
    currency    = req.body.currency ?? 'EUR',
    interval    = 'month',
    trialDays   = TRIAL_DAYS,
    therapistCount = 1,
  } = req.body

  // ── Validate plan ──────────────────────────────────────────
  let plan
  try {
    plan = await fetchPlan(planId)
  } catch {
    res.status(400).json({ error: `Plano desconhecido: ${planId}` })
    return
  }

  if (!plan.ativo) {
    res.status(400).json({ error: 'Este plano não está disponível.' })
    return
  }

  if (requiresCommercialContact(plan)) {
    res.status(402).json({
      error: `O plano ${plan.nome} requer contacto com a equipa comercial.`,
      needsCommercialContact: true,
      contactUrl: `${FRONTEND_URL}/contato?assunto=Enterprise`,
      code: 'COMMERCIAL_PLAN',
    })
    return
  }

  const count = parseInt(therapistCount, 10) || 1
  if (count > 10) {
    res.status(402).json({
      error: 'Para mais de 10 terapeutas, contacte a equipa comercial.',
      needsCommercialContact: true,
      contactUrl: `${FRONTEND_URL}/contato?assunto=Enterprise`,
      code: 'ABOVE_10_THERAPISTS',
    })
    return
  }

  if (plan.tipo === 'terapeuta' && count > 1) {
    res.status(400).json({
      error: `O plano ${plan.nome} permite apenas 1 terapeuta.`,
      code: 'THERAPIST_LIMIT_EXCEEDED',
    })
    return
  }

  const price = interval === 'year' ? plan.preco_anual_eur : plan.preco_mensal_eur
  if (!price || price === 0) {
    res.status(400).json({ error: 'Este plano não requer checkout.' })
    return
  }

  if (!['month', 'year'].includes(interval)) {
    res.status(400).json({ error: 'interval deve ser "month" ou "year".' })
    return
  }

  const validCurrency = CURRENCIES[currency.toUpperCase()] ? currency.toUpperCase() : 'EUR'
  const provider = getProvider('stripe')

  try {
    const result = await provider.createCheckout({
      userId:     req.user!.id,
      userEmail:  req.user!.email,
      planId,
      currency:   validCurrency,
      interval,
      trialDays:  Math.max(0, parseInt(trialDays, 10) || 0),
      successUrl: `${FRONTEND_URL}/dashboard/billing?checkout=success&plan=${planId}`,
      cancelUrl:  `${FRONTEND_URL}/dashboard/billing?checkout=cancelled`,
      metadata:   {
        user_id:          req.user!.id,
        plan_id:          planId,
        interval,
        therapist_count:  String(count),
      },
    })

    res.json({ provider: 'stripe', ...result })
  } catch (err) {
    console.error('[/billing/checkout]', err)
    const msg = err instanceof Error ? err.message : 'Checkout failed'
    res.status(500).json({ error: msg })
  }
})

// POST /billing/upgrade
// Body: { newPlanId, interval?, timing? }
router.post('/upgrade', requireAuth, async (req: AuthRequest, res: Response) => {
  const { newPlanId, interval = 'month', timing = 'immediate' } = req.body

  const profile = await getUserSubscription(req.user!.id)
  if (!profile?.stripe_subscription_id) {
    res.status(400).json({ error: 'Sem assinatura ativa. Use /billing/checkout.' })
    return
  }

  let newPlan
  try {
    newPlan = await fetchPlan(newPlanId)
  } catch {
    res.status(400).json({ error: `Plano desconhecido: ${newPlanId}` })
    return
  }

  if (requiresCommercialContact(newPlan)) {
    res.status(402).json({
      error: 'Este plano requer contacto comercial.',
      needsCommercialContact: true,
      contactUrl: `${FRONTEND_URL}/contato?assunto=Enterprise`,
      code: 'COMMERCIAL_PLAN',
    })
    return
  }

  const provider = getProvider('stripe') as { upgradeSubscription?: Function }
  if (!provider.upgradeSubscription) {
    res.status(501).json({ error: 'Upgrade not supported by provider.' })
    return
  }

  try {
    const result = await (provider as any).upgradeSubscription({
      providerSubscriptionId: profile.stripe_subscription_id,
      newPlanId,
      currency:               profile.currency_preference ?? 'EUR',
      interval,
      timing,
    })

    // Immediately reflect plan change in profile
    await supabaseAdmin
      .from('profiles')
      .update({ plan: newPlanId, updated_at: new Date().toISOString() })
      .eq('id', req.user!.id)

    await supabaseAdmin.from('subscription_events').insert({
      user_id:                  req.user!.id,
      event_type:               'subscription.upgraded',
      plan_id:                  newPlanId,
      provider:                 'stripe',
      provider_subscription_id: profile.stripe_subscription_id,
      metadata:                 { previous_plan: profile.plan, timing },
    })

    res.json({ success: true, ...result })
  } catch (err) {
    console.error('[/billing/upgrade]', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Upgrade failed.' })
  }
})

// POST /billing/cancel
// Body: { timing: 'immediate' | 'end_of_period', reason? }
router.post('/cancel', requireAuth, async (req: AuthRequest, res: Response) => {
  const { timing = 'end_of_period', reason } = req.body

  const profile = await getUserSubscription(req.user!.id)
  if (!profile?.stripe_subscription_id) {
    res.status(400).json({ error: 'Sem assinatura ativa.' })
    return
  }

  const provider = getProvider('stripe') as any
  if (!provider.cancelSubscription) {
    res.status(501).json({ error: 'Cancel not supported by provider.' })
    return
  }

  try {
    const result = await provider.cancelSubscription({
      providerSubscriptionId: profile.stripe_subscription_id,
      timing,
      reason,
    })

    if (timing === 'immediate') {
      await supabaseAdmin
        .from('profiles')
        .update({
          plan:                   'essencial',
          subscription_status:    'cancelled',
          stripe_subscription_id: null,
          plan_expires_at:        null,
          updated_at:             new Date().toISOString(),
        })
        .eq('id', req.user!.id)
    } else {
      // Mark as pending cancellation — access until period end
      await supabaseAdmin
        .from('profiles')
        .update({
          subscription_status: 'cancelled',
          plan_expires_at:     result.effectiveAt,
          updated_at:          new Date().toISOString(),
        })
        .eq('id', req.user!.id)
    }

    await supabaseAdmin.from('subscription_events').insert({
      user_id:                  req.user!.id,
      event_type:               'subscription.cancelled',
      plan_id:                  profile.plan,
      provider:                 'stripe',
      provider_subscription_id: profile.stripe_subscription_id,
      metadata:                 { timing, reason, effective_at: result.effectiveAt },
    })

    res.json({ success: true, ...result })
  } catch (err) {
    console.error('[/billing/cancel]', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Cancel failed.' })
  }
})

// POST /billing/reactivate — undo end-of-period cancellation
router.post('/reactivate', requireAuth, async (req: AuthRequest, res: Response) => {
  const profile = await getUserSubscription(req.user!.id)
  if (!profile?.stripe_subscription_id) {
    res.status(400).json({ error: 'Sem assinatura para reativar.' })
    return
  }

  const provider = getProvider('stripe') as any
  if (!provider.reactivateSubscription) {
    res.status(501).json({ error: 'Reactivation not supported.' })
    return
  }

  try {
    const result = await provider.reactivateSubscription(profile.stripe_subscription_id)

    await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: 'active',
        plan_expires_at:     null,
        updated_at:          new Date().toISOString(),
      })
      .eq('id', req.user!.id)

    res.json({ success: true, ...result })
  } catch (err) {
    console.error('[/billing/reactivate]', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Reactivation failed.' })
  }
})

// GET /billing/portal — Stripe Customer Portal
router.get('/portal', requireAuth, async (req: AuthRequest, res: Response) => {
  const profile = await getUserSubscription(req.user!.id)
  if (!profile?.stripe_customer_id) {
    res.status(400).json({ error: 'Sem conta Stripe. Complete um checkout primeiro.' })
    return
  }

  const provider = getProvider('stripe') as any
  if (!provider.createPortalSession) {
    res.status(501).json({ error: 'Portal not available.' })
    return
  }

  try {
    const { url } = await provider.createPortalSession({
      providerCustomerId: profile.stripe_customer_id,
      returnUrl:          `${FRONTEND_URL}/dashboard/billing`,
    })
    res.json({ url })
  } catch (err) {
    console.error('[/billing/portal]', err)
    res.status(500).json({ error: 'Portal session failed.' })
  }
})

// ─── Webhooks ─────────────────────────────────────────────────
// Raw body is applied by index.ts before JSON parsing.

// POST /billing/webhook/stripe
router.post('/webhook/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string
  if (!sig) {
    res.status(400).json({ error: 'Missing Stripe signature.' })
    return
  }

  const provider = getProvider('stripe')
  let result
  try {
    result = await provider.handleWebhook(req.body as Buffer, sig)
  } catch (err) {
    console.error('[Stripe webhook] signature error:', err)
    res.status(400).json({ error: 'Invalid signature.' })
    return
  }

  try {
    await processWebhookResult(result)
  } catch (err) {
    console.error('[Stripe webhook] processing error:', err)
    // Return 200 so Stripe doesn't retry — log and investigate separately
  }

  res.json({ received: true })
})

// POST /billing/webhook/mbway (future)
router.post('/webhook/mbway', async (req: Request, res: Response) => {
  if (process.env.ENABLE_MBWAY !== 'true') {
    res.status(404).json({ error: 'MBWay not enabled.' })
    return
  }
  // TODO: implement when MBWay provider is active
  res.json({ received: true })
})

// POST /billing/webhook/multibanco (future)
router.post('/webhook/multibanco', async (req: Request, res: Response) => {
  if (process.env.ENABLE_MULTIBANCO !== 'true') {
    res.status(404).json({ error: 'Multibanco not enabled.' })
    return
  }
  // TODO: implement when Multibanco provider is active
  res.json({ received: true })
})

// ─── Webhook dispatcher ───────────────────────────────────────

async function processWebhookResult(result: Awaited<ReturnType<typeof getProvider>['handleWebhook'] extends (...args: any[]) => Promise<infer R> ? Promise<R> : never> | any) {
  const r = result as {
    type: string
    userId?: string
    planId?: string
    previousPlanId?: string
    providerCustomerId?: string
    providerSubscriptionId?: string
    amountCents?: number
    currency?: string
    trialEndsAt?: string
    currentPeriodEnd?: string
  }

  // Resolve user if missing (lookup by subscription ID)
  async function resolveUser(): Promise<string | null> {
    if (r.userId) return r.userId
    if (!r.providerSubscriptionId) return null
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('stripe_subscription_id', r.providerSubscriptionId)
      .maybeSingle()
    return data?.id ?? null
  }

  switch (r.type) {

    case 'subscription.trial_started': {
      const userId = await resolveUser()
      if (!userId || !r.planId) break
      await applySubscription({
        userId,
        planId:               r.planId,
        stripeCustomerId:     r.providerCustomerId!,
        stripeSubscriptionId: r.providerSubscriptionId!,
        status:               'trialing',
        trialEndsAt:          r.trialEndsAt,
        currentPeriodEnd:     r.currentPeriodEnd,
        event:                'subscription.trial_started',
        amountCents:          0,
        currency:             r.currency,
      })
      // Issue a trial chave
      await createChave({
        tipo:         'trial_30_dias',
        planoId:      r.planId,
        validadeDias: TRIAL_DAYS,
        criadoPor:    'stripe_webhook',
      })
      break
    }

    case 'subscription.activated': {
      const userId = await resolveUser()
      if (!userId || !r.planId) break
      await applySubscription({
        userId,
        planId:               r.planId,
        stripeCustomerId:     r.providerCustomerId!,
        stripeSubscriptionId: r.providerSubscriptionId!,
        status:               'active',
        trialEndsAt:          null,
        currentPeriodEnd:     r.currentPeriodEnd,
        event:                'subscription.activated',
        amountCents:          r.amountCents,
        currency:             r.currency,
      })
      await issueActivationKey(userId, r.planId)
      break
    }

    case 'subscription.renewed': {
      // Just log — plan and access remain unchanged
      await supabaseAdmin.from('subscription_events').insert({
        event_type:               'subscription.renewed',
        plan_id:                  r.planId,
        provider:                 'stripe',
        provider_subscription_id: r.providerSubscriptionId,
        amount_cents:             r.amountCents,
        currency:                 r.currency,
      })
      break
    }

    case 'subscription.upgraded':
    case 'subscription.downgraded': {
      const userId = await resolveUser()
      if (!userId || !r.planId) break
      await supabaseAdmin
        .from('profiles')
        .update({ plan: r.planId, updated_at: new Date().toISOString() })
        .eq('id', userId)
      await supabaseAdmin.from('subscription_events').insert({
        user_id:                  userId,
        event_type:               r.type,
        plan_id:                  r.planId,
        provider:                 'stripe',
        provider_subscription_id: r.providerSubscriptionId,
        metadata:                 { previous_plan: r.previousPlanId },
      })
      break
    }

    case 'subscription.cancelled': {
      const userId = await resolveUser()
      if (!userId) break
      await supabaseAdmin
        .from('profiles')
        .update({
          plan:                   'essencial',
          subscription_status:    'cancelled',
          stripe_subscription_id: null,
          plan_expires_at:        r.currentPeriodEnd ?? null,
          updated_at:             new Date().toISOString(),
        })
        .eq('id', userId)
      await supabaseAdmin.from('subscription_events').insert({
        user_id:                  userId,
        event_type:               'subscription.cancelled',
        plan_id:                  r.planId,
        provider:                 'stripe',
        provider_subscription_id: r.providerSubscriptionId,
        metadata:                 { period_end: r.currentPeriodEnd },
      })
      break
    }

    case 'payment.failed': {
      const userId = await resolveUser()
      await supabaseAdmin.from('subscription_events').insert({
        user_id:                  userId,
        event_type:               'payment.failed',
        provider:                 'stripe',
        provider_subscription_id: r.providerSubscriptionId,
        amount_cents:             r.amountCents,
        currency:                 r.currency,
      })
      if (userId) {
        await supabaseAdmin
          .from('profiles')
          .update({ subscription_status: 'past_due', updated_at: new Date().toISOString() })
          .eq('id', userId)
      }
      break
    }

    case 'payment.refunded': {
      await supabaseAdmin.from('subscription_events').insert({
        event_type:   'payment.refunded',
        provider:     'stripe',
        amount_cents: r.amountCents,
        currency:     r.currency,
      })
      break
    }

    case 'subscription.trial_ending': {
      // Could send an email here in the future
      await supabaseAdmin.from('subscription_events').insert({
        event_type:               'subscription.trial_ending',
        provider:                 'stripe',
        provider_subscription_id: r.providerSubscriptionId,
        metadata:                 { trial_ends_at: r.trialEndsAt },
      })
      break
    }

    default:
      break
  }
}

export default router
