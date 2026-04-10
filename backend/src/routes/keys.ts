import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { requireAuth, AuthRequest } from '../middleware/auth'
import {
  createActivationKey,
  activateKey,
  validateKey,
  listKeysForUser,
  getActiveKeyForUser,
  revokeKey,
  revokeUnusedKeysForUser,
  KeyActivationError,
  type KeyType,
} from '../lib/activation'
import { supabaseAdmin } from '../lib/supabase'

const router = Router()

// ─── Admin guard ──────────────────────────────────────────────────────────────
// Simple secret-header guard until a proper admin role is implemented.
// Set ADMIN_SECRET in .env

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const secret = req.headers['x-admin-secret']
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  next()
}

// ─── Shared error handler ─────────────────────────────────────────────────────

function handleKeyError(err: unknown, res: Response) {
  if (err instanceof KeyActivationError) {
    const status = err.reason === 'not_found' ? 404 : 400
    res.status(status).json({ error: err.message, reason: err.reason })
    return
  }
  console.error('[keys]', err)
  res.status(500).json({ error: 'Internal error' })
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// POST /keys/check — check if a key is valid without consuming it
router.post('/check', async (req: Request, res: Response) => {
  const { key } = req.body
  if (!key) { res.status(400).json({ error: 'key is required' }); return }

  try {
    const record = await validateKey(key)
    res.json({
      valid: true,
      key_type: record.key_type,
      plan: record.plan,
      expires_at: record.expires_at,
    })
  } catch (err) {
    if (err instanceof KeyActivationError) {
      res.json({ valid: false, reason: err.reason, error: err.message })
      return
    }
    handleKeyError(err, res)
  }
})

// POST /keys/activate — activate a key for the authenticated user (single-use)
router.post('/activate', requireAuth, async (req: AuthRequest, res: Response) => {
  const { key } = req.body
  if (!key) { res.status(400).json({ error: 'key is required' }); return }

  try {
    const result = await activateKey(key, req.user!.id)

    res.json({
      success: true,
      plan: result.planActivated,
      key_type: result.key.key_type,
      expires_at: result.expiresAt,
      message: messageForType(result.key.key_type, result.planActivated, result.expiresAt),
    })
  } catch (err) {
    handleKeyError(err, res)
  }
})

// POST /keys/trial — self-serve trial: authenticated user starts their 30-day trial
router.post('/trial', requireAuth, async (req: AuthRequest, res: Response) => {
  const { plan = 'pro' } = req.body

  // Check if user already used a trial
  const { data: existingTrial } = await supabaseAdmin
    .from('activation_keys')
    .select('id, used_at')
    .eq('used_by_user_id', req.user!.id)
    .eq('key_type', 'trial')
    .maybeSingle()

  if (existingTrial?.used_at) {
    res.status(400).json({
      error: 'Você já utilizou o período de trial.',
      reason: 'trial_already_used',
    })
    return
  }

  // Check if user already has a paid subscription
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('plan, stripe_subscription_id')
    .eq('id', req.user!.id)
    .single()

  if (profile?.stripe_subscription_id) {
    res.status(400).json({
      error: 'Você já possui uma assinatura ativa.',
      reason: 'already_subscribed',
    })
    return
  }

  try {
    // Create trial key owned by this user
    const keyRecord = await createActivationKey({
      type: 'trial',
      plan: plan === 'enterprise' ? 'enterprise' : 'pro',
      ownerUserId: req.user!.id,
      issuedBy: 'self-serve-trial',
    })

    // Immediately activate it
    const result = await activateKey(keyRecord.key, req.user!.id)

    res.status(201).json({
      success: true,
      key: keyRecord.key,
      plan: result.planActivated,
      expires_at: result.expiresAt,
      days_remaining: 30,
      message: `Trial de 30 dias do plano ${result.planActivated} ativado com sucesso.`,
    })
  } catch (err) {
    handleKeyError(err, res)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// AUTHENTICATED USER ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /keys/mine — list all keys owned by or used by the current user
router.get('/mine', requireAuth, async (req: AuthRequest, res: Response) => {
  const keys = await listKeysForUser(req.user!.id)
  res.json(
    keys.map((k) => ({
      key: k.key,
      key_type: k.key_type,
      plan: k.plan,
      status: keyStatus(k),
      created_at: k.created_at,
      expires_at: k.expires_at,
      used_at: k.used_at,
    }))
  )
})

// GET /keys/current — get the current active key for the user's plan
router.get('/current', requireAuth, async (req: AuthRequest, res: Response) => {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('plan')
    .eq('id', req.user!.id)
    .single()

  if (!profile || profile.plan === 'free') {
    res.json({ key: null, message: 'Nenhuma chave ativa no plano gratuito.' })
    return
  }

  const key = await getActiveKeyForUser(req.user!.id, profile.plan)
  if (!key) {
    res.json({ key: null })
    return
  }

  res.json({
    key: key.key,
    key_type: key.key_type,
    plan: key.plan,
    status: keyStatus(key),
    expires_at: key.expires_at,
    used_at: key.used_at,
    days_remaining: key.expires_at ? daysRemaining(key.expires_at) : null,
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES  (require x-admin-secret header)
// ═══════════════════════════════════════════════════════════════════════════════

const generateSchema = z.object({
  key_type: z.enum(['payment', 'trial', 'affiliate']),
  plan: z.enum(['pro', 'enterprise']),
  owner_user_id: z.string().uuid().optional(),
  ttl_days: z.number().int().positive().nullable().optional(),
  affiliate_code: z.string().min(3).max(32).optional(),
  quantity: z.number().int().min(1).max(100).default(1),
  metadata: z.record(z.unknown()).optional(),
})

// POST /keys/admin/generate — generate keys in bulk
router.post('/admin/generate', requireAdmin, async (req: Request, res: Response) => {
  const parsed = generateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const { key_type, plan, owner_user_id, ttl_days, affiliate_code, quantity, metadata } = parsed.data

  if (key_type === 'affiliate' && !affiliate_code) {
    res.status(400).json({ error: 'affiliate_code is required for affiliate keys' })
    return
  }

  const keys: string[] = []
  const errors: string[] = []

  for (let i = 0; i < quantity; i++) {
    try {
      const record = await createActivationKey({
        type: key_type as KeyType,
        plan,
        ownerUserId: owner_user_id,
        issuedBy: 'admin',
        affiliateCode: affiliate_code,
        ttlDays: ttl_days,
        metadata,
      })
      keys.push(record.key)
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err))
    }
  }

  res.status(201).json({
    generated: keys.length,
    keys,
    errors: errors.length ? errors : undefined,
  })
})

// POST /keys/admin/revoke — revoke a key by ID or key string
router.post('/admin/revoke', requireAdmin, async (req: Request, res: Response) => {
  const { key_id, key, reason = 'admin_revoked' } = req.body

  let id = key_id
  if (!id && key) {
    const { data } = await supabaseAdmin
      .from('activation_keys')
      .select('id')
      .eq('key', key)
      .maybeSingle()
    id = data?.id
  }

  if (!id) { res.status(404).json({ error: 'Key not found' }); return }

  await revokeKey(id, reason)
  res.json({ success: true, revoked_id: id })
})

// POST /keys/admin/revoke-user — revoke all unused keys for a user
router.post('/admin/revoke-user', requireAdmin, async (req: Request, res: Response) => {
  const { user_id, reason = 'admin_revoked' } = req.body
  if (!user_id) { res.status(400).json({ error: 'user_id is required' }); return }

  await revokeUnusedKeysForUser(user_id, reason)
  res.json({ success: true })
})

// GET /keys/admin/list — list keys with filters
router.get('/admin/list', requireAdmin, async (req: Request, res: Response) => {
  const { key_type, plan, used, revoked, limit = '50', offset = '0' } = req.query

  let query = supabaseAdmin
    .from('activation_keys')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1)

  if (key_type) query = query.eq('key_type', key_type)
  if (plan) query = query.eq('plan', plan)
  if (used === 'true') query = query.not('used_at', 'is', null)
  if (used === 'false') query = query.is('used_at', null)
  if (revoked === 'true') query = query.eq('revoked', true)
  if (revoked === 'false') query = query.eq('revoked', false)

  const { data, count, error } = await query
  if (error) { res.status(500).json({ error: error.message }); return }

  res.json({ total: count, keys: data })
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function keyStatus(k: { used_at: string | null; revoked: boolean; expires_at: string | null }): string {
  if (k.revoked) return 'revoked'
  if (k.used_at) return 'used'
  if (k.expires_at && new Date(k.expires_at) < new Date()) return 'expired'
  return 'valid'
}

function daysRemaining(expiresAt: string): number {
  const ms = new Date(expiresAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / 86_400_000))
}

function messageForType(type: string, plan: string, expiresAt: string | null): string {
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  switch (type) {
    case 'trial':
      return `Trial do plano ${capitalize(plan)} ativado! Válido por ${daysRemaining(expiresAt!)} dias.`
    case 'affiliate':
      return `Acesso via parceiro ativado. Plano ${capitalize(plan)} liberado.`
    default:
      return `Plano ${capitalize(plan)} ativado com sucesso.`
  }
}

export default router
