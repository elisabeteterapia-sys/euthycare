// ─── Plan types & permission helpers ──────────────────────────
// Single source of truth for what each plan can and cannot do.
// The canonical data lives in the DB (plans table); this file
// mirrors the shape and provides runtime permission checks.

import { supabaseAdmin } from './supabase'

// ── Enums (mirror DB) ─────────────────────────────────────────

export type PlanTipo = 'terapeuta' | 'clinica' | 'enterprise'
export type IaNivel  = 'nenhuma'  | 'basica'  | 'completa'
export type BackupTipo = 'nenhum' | 'parcial' | 'completo'

// ── DB plan shape ─────────────────────────────────────────────

export interface Plan {
  id: string
  nome: string
  descricao: string | null
  tipo: PlanTipo
  limite_terapeutas: number           // 999 = unlimited (enterprise only)
  contato_comercial: boolean          // true = no self-serve checkout
  ia_nivel: IaNivel
  tem_backup: boolean
  tipo_backup: BackupTipo
  exportacao_total: boolean
  download_cliente: boolean
  preco_mensal_eur: number
  preco_anual_eur: number
  desconto_anual_pct: number
  features: string[]
  // Stripe Price IDs
  stripe_price_mensal_eur: string | null
  stripe_price_mensal_usd: string | null
  stripe_price_mensal_brl: string | null
  stripe_price_anual_eur: string | null
  stripe_price_anual_usd: string | null
  stripe_price_anual_brl: string | null
  ativo: boolean
  ordem: number
}

// ── DB access ─────────────────────────────────────────────────

export async function fetchPlans(): Promise<Plan[]> {
  const { data, error } = await supabaseAdmin
    .from('plans')
    .select('*')
    .eq('ativo', true)
    .order('ordem')

  if (error) throw new Error(`fetchPlans: ${error.message}`)
  return (data ?? []) as Plan[]
}

export async function fetchPlan(id: string): Promise<Plan> {
  const { data, error } = await supabaseAdmin
    .from('plans')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) throw new Error(`Plan not found: ${id}`)
  return data as Plan
}

/** Returns therapist plans only (tipo = 'terapeuta'), sorted by ordem */
export async function fetchTerapeutaPlans(): Promise<Plan[]> {
  const { data, error } = await supabaseAdmin
    .from('plans')
    .select('*')
    .eq('ativo', true)
    .eq('tipo', 'terapeuta')
    .order('ordem')

  if (error) throw new Error(`fetchTerapeutaPlans: ${error.message}`)
  return (data ?? []) as Plan[]
}

// ── Permission helpers ────────────────────────────────────────
// Used by both route guards (backend) and UI (frontend mirrors these).

export interface PlanPermissions {
  canAccessIA: boolean
  canUseFullIA: boolean
  canUseBackup: boolean
  hasFullBackup: boolean
  canExportAll: boolean
  canDownloadPerClient: boolean
  maxTherapists: number
  isEnterprise: boolean
  isClinica: boolean
  needsCommercialContact: boolean
}

export function getPlanPermissions(plan: Plan): PlanPermissions {
  return {
    canAccessIA:            plan.ia_nivel !== 'nenhuma',
    canUseFullIA:           plan.ia_nivel === 'completa',
    canUseBackup:           plan.tem_backup,
    hasFullBackup:          plan.tipo_backup === 'completo',
    canExportAll:           plan.exportacao_total,
    canDownloadPerClient:   plan.download_cliente,
    maxTherapists:          plan.limite_terapeutas,
    isEnterprise:           plan.tipo === 'enterprise',
    isClinica:              plan.tipo === 'clinica' || plan.tipo === 'enterprise',
    needsCommercialContact: plan.contato_comercial,
  }
}

/** Validates that a therapist count is within plan limits.
 *  Returns an error message or null if OK. */
export function checkTherapistLimit(
  plan: Plan,
  requestedCount: number,
  customLimit?: number | null
): string | null {
  const effectiveLimit = customLimit ?? plan.limite_terapeutas

  if (plan.tipo === 'terapeuta' && requestedCount > 1) {
    return `O plano ${plan.nome} permite apenas 1 terapeuta. Faça upgrade para o plano Clínica.`
  }

  if (requestedCount > effectiveLimit) {
    if (requestedCount > 10 && plan.tipo !== 'enterprise') {
      return 'Para mais de 10 terapeutas, contacte a equipa comercial para o plano Enterprise.'
    }
    return `O plano ${plan.nome} permite no máximo ${effectiveLimit} terapeutas.`
  }

  return null
}

/** Checks if a checkout should be blocked and redirected to commercial contact. */
export function requiresCommercialContact(
  plan: Plan,
  requestedTherapists?: number
): boolean {
  if (plan.contato_comercial) return true
  if (requestedTherapists && requestedTherapists > 10) return true
  return false
}
