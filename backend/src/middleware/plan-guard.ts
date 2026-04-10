// ─── Plan-based permission middleware ─────────────────────────
// Use these guards on routes that require specific plan features.
// All guards assume requireAuth has already run (req.user populated).

import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth'
import { supabaseAdmin } from '../lib/supabase'
import { fetchPlan, getPlanPermissions, checkTherapistLimit } from '../lib/plans'

// ── Profile cache per request ─────────────────────────────────

interface ProfileSnapshot {
  plan: string
  plan_expires_at: string | null
  limite_terapeutas_custom: number | null
}

async function getProfile(userId: string): Promise<ProfileSnapshot | null> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('plan, plan_expires_at, limite_terapeutas_custom')
    .eq('id', userId)
    .single()
  return data as ProfileSnapshot | null
}

// ── Helper: check plan validity (not expired trial) ───────────

function isPlanActive(profile: ProfileSnapshot): boolean {
  if (!profile.plan_expires_at) return true
  return new Date(profile.plan_expires_at) > new Date()
}

// ── Guard factory ─────────────────────────────────────────────

type PermissionKey = keyof ReturnType<typeof getPlanPermissions>

/**
 * Generates an Express middleware that checks a plan permission.
 * Example: requirePermission('canExportAll')
 */
export function requirePermission(permission: PermissionKey) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const profile = await getProfile(req.user!.id)

    if (!profile) {
      res.status(403).json({ error: 'Perfil não encontrado.' })
      return
    }

    if (!isPlanActive(profile)) {
      res.status(403).json({
        error: 'O seu plano de teste expirou. Faça upgrade para continuar.',
        code: 'PLAN_EXPIRED',
      })
      return
    }

    let plan
    try {
      plan = await fetchPlan(profile.plan)
    } catch {
      res.status(403).json({ error: `Plano desconhecido: ${profile.plan}` })
      return
    }

    const permissions = getPlanPermissions(plan)

    if (!permissions[permission]) {
      res.status(403).json({
        error: `O seu plano (${plan.nome}) não inclui esta funcionalidade.`,
        requiredPermission: permission,
        currentPlan: plan.id,
        code: 'PLAN_UPGRADE_REQUIRED',
      })
      return
    }

    next()
  }
}

/**
 * Validates the therapist count in req.body against the user's plan.
 * Reads `therapistCount` from body (defaults to 1).
 * Returns 402 with `needsCommercialContact: true` if > 10.
 */
export async function validateTherapistCount(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const therapistCount: number = parseInt(req.body.therapistCount ?? '1', 10) || 1

  const profile = await getProfile(req.user!.id)
  if (!profile) {
    res.status(403).json({ error: 'Perfil não encontrado.' })
    return
  }

  // > 10 always goes to commercial
  if (therapistCount > 10) {
    res.status(402).json({
      error: 'Para mais de 10 terapeutas, contacte a equipa comercial.',
      needsCommercialContact: true,
      contactUrl: '/contato?assunto=Enterprise',
      code: 'ENTERPRISE_REQUIRED',
    })
    return
  }

  let plan
  try {
    plan = await fetchPlan(profile.plan)
  } catch {
    next()
    return
  }

  const limitError = checkTherapistLimit(plan, therapistCount, profile.limite_terapeutas_custom)
  if (limitError) {
    res.status(402).json({
      error: limitError,
      needsUpgrade: true,
      currentPlan: plan.id,
      code: 'THERAPIST_LIMIT_EXCEEDED',
    })
    return
  }

  next()
}

/**
 * Blocks self-serve checkout for enterprise/commercial-only plans.
 * Checks the planId in req.body against DB.
 */
export async function blockCommercialPlans(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const planId = req.body.planId as string | undefined
  if (!planId) { next(); return }

  let plan
  try {
    plan = await fetchPlan(planId)
  } catch {
    next()
    return
  }

  if (plan.contato_comercial) {
    res.status(402).json({
      error: `O plano ${plan.nome} requer contacto com a equipa comercial.`,
      needsCommercialContact: true,
      contactUrl: '/contato?assunto=Enterprise',
      code: 'COMMERCIAL_PLAN',
    })
    return
  }

  next()
}

/**
 * Checks that a therapistCount in the checkout body does not exceed 10.
 * If it does, blocks and returns commercial contact instructions.
 */
export async function blockAbove10Therapists(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const count = parseInt(req.body.therapistCount ?? '1', 10) || 1
  if (count > 10) {
    res.status(402).json({
      error: 'Para mais de 10 terapeutas, não é possível fazer checkout automático.',
      needsCommercialContact: true,
      contactUrl: '/contato?assunto=Enterprise',
      code: 'ABOVE_10_THERAPISTS',
    })
    return
  }
  next()
}
