// ─── Chaves de Ativação V2 ────────────────────────────────────
// Handles the new chaves_ativacao table with 6 key types.
// Replaces the legacy activation_keys / activation.ts system.

import { randomBytes } from 'crypto'
import { supabaseAdmin } from './supabase'
import type { Plan } from './plans'

// ── Types ─────────────────────────────────────────────────────

export type ChaveTipo =
  | 'trial_30_dias'
  | 'pos_pagamento'
  | 'parceiro_futuro'
  | 'upgrade_plano'
  | 'clinica_especial'
  | 'enterprise'

export interface ChaveAtivacao {
  id: string
  codigo: string
  tipo: ChaveTipo
  plano_id: string | null
  limite_terapeutas_custom: number | null
  recursos_custom_json: Record<string, unknown>
  validade_dias: number | null
  expirado_em: string | null
  usado: boolean
  usado_por_clinica_id: string | null
  usado_em: string | null
  revogado: boolean
  revogado_em: string | null
  revogado_motivo: string | null
  criado_por: string
  criado_em: string
}

export interface ChaveEstado extends ChaveAtivacao {
  estado: 'ativa' | 'utilizada' | 'expirada' | 'revogada'
}

export type ChaveRejectionReason =
  | 'not_found'
  | 'already_used'
  | 'expired'
  | 'revoked'
  | 'wrong_type'

export class ChaveError extends Error {
  constructor(
    public readonly reason: ChaveRejectionReason,
    message: string
  ) {
    super(message)
    this.name = 'ChaveError'
  }
}

export interface ActivateChaveResult {
  success: boolean
  chave: ChaveAtivacao
  planoId: string | null
  limiteTerapeutasEfetivo: number | null
  recursosCustom: Record<string, unknown>
  expiresAt: string | null
}

// ── Key format ────────────────────────────────────────────────
// Pattern: ETHY-{PREFIX}-XXXX-XXXX-XXXX
// Prefixes: TRL, PAY, PAR, UPG, CLI, ENT

const TYPE_PREFIX: Record<ChaveTipo, string> = {
  trial_30_dias:   'TRL',
  pos_pagamento:   'PAY',
  parceiro_futuro: 'PAR',
  upgrade_plano:   'UPG',
  clinica_especial:'CLI',
  enterprise:      'ENT',
}

const DEFAULT_TTL_DAYS: Record<ChaveTipo, number | null> = {
  trial_30_dias:    30,
  pos_pagamento:    null,   // tied to subscription, no expiry
  parceiro_futuro:  90,     // unclaimed affiliate key
  upgrade_plano:    null,
  clinica_especial: null,
  enterprise:       null,
}

function generateSegments(): string {
  const raw = randomBytes(6).toString('hex').toUpperCase()
  return `${raw.slice(0,4)}-${raw.slice(4,8)}-${raw.slice(8,12)}`
}

export function formatChaveCodigo(tipo: ChaveTipo): string {
  return `ETHY-${TYPE_PREFIX[tipo]}-${generateSegments()}`
}

// ── Create ────────────────────────────────────────────────────

interface CreateChaveOptions {
  tipo: ChaveTipo
  planoId?: string | null
  limiteTerapeutasCustom?: number | null
  recursosCustom?: Record<string, unknown>
  validadeDias?: number | null
  criadoPor?: string
}

export async function createChave(opts: CreateChaveOptions): Promise<ChaveAtivacao> {
  const {
    tipo,
    planoId      = null,
    limiteTerapeutasCustom = null,
    recursosCustom = {},
    validadeDias = DEFAULT_TTL_DAYS[tipo],
    criadoPor    = 'system',
  } = opts

  const codigo = formatChaveCodigo(tipo)

  const { data, error } = await supabaseAdmin
    .from('chaves_ativacao')
    .insert({
      codigo,
      tipo,
      plano_id:                 planoId,
      limite_terapeutas_custom: limiteTerapeutasCustom,
      recursos_custom_json:     recursosCustom,
      validade_dias:            validadeDias,
      criado_por:               criadoPor,
    })
    .select()
    .single()

  if (error) throw new Error(`createChave failed: ${error.message}`)
  return data as ChaveAtivacao
}

/** Bulk create — useful for admin panel / partner onboarding */
export async function createChavesBulk(
  opts: CreateChaveOptions,
  quantidade: number
): Promise<ChaveAtivacao[]> {
  const results: ChaveAtivacao[] = []
  for (let i = 0; i < quantidade; i++) {
    results.push(await createChave(opts))
  }
  return results
}

// ── Validate ──────────────────────────────────────────────────

export async function validateChave(codigo: string): Promise<ChaveAtivacao> {
  const { data, error } = await supabaseAdmin
    .from('chaves_ativacao')
    .select('*')
    .eq('codigo', codigo.trim().toUpperCase())
    .maybeSingle()

  if (error || !data) {
    throw new ChaveError('not_found', 'Chave de ativação não encontrada.')
  }

  const rec = data as ChaveAtivacao

  if (rec.revogado) {
    throw new ChaveError('revoked', 'Esta chave foi revogada.')
  }

  if (rec.usado) {
    throw new ChaveError('already_used', 'Esta chave já foi utilizada.')
  }

  if (rec.expirado_em && new Date(rec.expirado_em) < new Date()) {
    throw new ChaveError('expired', 'Esta chave expirou.')
  }

  return rec
}

// ── Activate ──────────────────────────────────────────────────

/**
 * Atomically marks the key as used and applies the plan/resources to the user.
 * Single-use enforced via conditional UPDATE (WHERE usado = false).
 */
export async function activateChave(
  codigo: string,
  userId: string
): Promise<ActivateChaveResult> {
  const rec = await validateChave(codigo)

  // Atomic single-use update
  const { data: updated, error } = await supabaseAdmin
    .from('chaves_ativacao')
    .update({
      usado:                true,
      usado_por_clinica_id: userId,
      usado_em:             new Date().toISOString(),
    })
    .eq('id', rec.id)
    .eq('usado', false)     // atomic guard
    .eq('revogado', false)
    .select()
    .maybeSingle()

  if (error || !updated) {
    // Check if same user is retrying (idempotent)
    const { data: current } = await supabaseAdmin
      .from('chaves_ativacao')
      .select('usado_por_clinica_id, usado_em')
      .eq('id', rec.id)
      .single()

    if (current?.usado_por_clinica_id === userId) {
      await applyChaveToProfile(userId, rec)
      return buildResult(rec, { ...rec, usado: true, usado_por_clinica_id: userId, usado_em: current.usado_em })
    }

    throw new ChaveError('already_used', 'Esta chave já foi utilizada por outro utilizador.')
  }

  const activatedRec = updated as ChaveAtivacao
  await applyChaveToProfile(userId, activatedRec)

  return buildResult(rec, activatedRec)
}

function buildResult(original: ChaveAtivacao, activated: ChaveAtivacao): ActivateChaveResult {
  return {
    success:                    true,
    chave:                      activated,
    planoId:                    original.plano_id,
    limiteTerapeutasEfetivo:    original.limite_terapeutas_custom,
    recursosCustom:             original.recursos_custom_json,
    expiresAt:                  original.expirado_em,
  }
}

// ── Plan application ──────────────────────────────────────────

async function applyChaveToProfile(userId: string, chave: ChaveAtivacao) {
  if (!chave.plano_id) return  // key with no plan (partner keys, etc.) — nothing to apply yet

  const isTrial = chave.tipo === 'trial_30_dias'

  await supabaseAdmin
    .from('profiles')
    .update({
      plan:             chave.plano_id,
      plan_expires_at:  isTrial ? chave.expirado_em : null,
      // Store custom therapist limit on profile for middleware checks
      limite_terapeutas_custom: chave.limite_terapeutas_custom ?? null,
      updated_at:       new Date().toISOString(),
    })
    .eq('id', userId)
}

// ── Revoke ────────────────────────────────────────────────────

export async function revokeChave(id: string, motivo: string): Promise<void> {
  await supabaseAdmin
    .from('chaves_ativacao')
    .update({ revogado: true, revogado_em: new Date().toISOString(), revogado_motivo: motivo })
    .eq('id', id)
}

export async function revokeChavesByCodigos(codigos: string[], motivo: string): Promise<void> {
  await supabaseAdmin
    .from('chaves_ativacao')
    .update({ revogado: true, revogado_em: new Date().toISOString(), revogado_motivo: motivo })
    .in('codigo', codigos.map(c => c.toUpperCase()))
    .eq('usado', false)
    .eq('revogado', false)
}

// ── Query helpers ─────────────────────────────────────────────

export async function getChaveByUser(userId: string): Promise<ChaveAtivacao | null> {
  const { data } = await supabaseAdmin
    .from('chaves_ativacao')
    .select('*')
    .eq('usado_por_clinica_id', userId)
    .order('usado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data as ChaveAtivacao | null)
}

export async function listChaves(filters?: {
  tipo?: ChaveTipo
  planoId?: string
  usado?: boolean
  revogado?: boolean
  limit?: number
}): Promise<ChaveAtivacao[]> {
  let query = supabaseAdmin
    .from('chaves_ativacao')
    .select('*')
    .order('criado_em', { ascending: false })

  if (filters?.tipo)    query = query.eq('tipo', filters.tipo)
  if (filters?.planoId) query = query.eq('plano_id', filters.planoId)
  if (filters?.usado    !== undefined) query = query.eq('usado', filters.usado)
  if (filters?.revogado !== undefined) query = query.eq('revogado', filters.revogado)
  if (filters?.limit)   query = query.limit(filters.limit)

  const { data } = await query
  return (data ?? []) as ChaveAtivacao[]
}
