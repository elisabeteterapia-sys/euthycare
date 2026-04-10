import { randomBytes } from 'crypto'
import { supabaseAdmin } from './supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export type KeyType = 'payment' | 'trial' | 'affiliate'

export interface ActivationKey {
  id: string
  key: string
  key_type: KeyType
  plan: string
  owner_user_id: string | null
  issued_by: string
  affiliate_code: string | null
  created_at: string
  expires_at: string | null
  used_at: string | null
  used_by_user_id: string | null
  revoked: boolean
  revoked_at: string | null
  revoked_reason: string | null
  metadata: Record<string, unknown>
}

export interface ActivateResult {
  success: boolean
  key: ActivationKey
  planActivated: string
  expiresAt: string | null
}

// ─── Rejection reasons (typed for the API layer) ──────────────────────────────
export type KeyRejectionReason =
  | 'not_found'
  | 'already_used'
  | 'expired'
  | 'revoked'

export class KeyActivationError extends Error {
  constructor(
    public readonly reason: KeyRejectionReason,
    message: string
  ) {
    super(message)
    this.name = 'KeyActivationError'
  }
}

// ─── Key format ───────────────────────────────────────────────────────────────
// ETHY-{TYPE_PREFIX}-XXXX-XXXX-XXXX
// Examples:
//   ETHY-PAY-A1B2-3C4D-E5F6   (payment)
//   ETHY-TRL-F7G8-9H0I-J1K2   (trial)
//   ETHY-AFF-L3M4-N5O6-P7Q8   (affiliate)

const TYPE_PREFIX: Record<KeyType, string> = {
  payment:   'PAY',
  trial:     'TRL',
  affiliate: 'AFF',
}

function generateRaw(): string {
  return randomBytes(6).toString('hex').toUpperCase() // 12 hex chars
}

export function formatKey(type: KeyType): string {
  const prefix = TYPE_PREFIX[type]
  const raw = generateRaw()
  return `ETHY-${prefix}-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`
}

// ─── TTL per key type ─────────────────────────────────────────────────────────

const DEFAULT_TTL_DAYS: Record<KeyType, number | null> = {
  payment:   null,   // no expiry — tied to subscription lifetime
  trial:     30,
  affiliate: 90,     // affiliate key itself expires in 90 days if unclaimed
}

function expiresAt(days: number | null): string | null {
  if (days === null) return null
  return new Date(Date.now() + days * 86_400_000).toISOString()
}

// ─── Create ───────────────────────────────────────────────────────────────────

interface CreateKeyOptions {
  type: KeyType
  plan: string
  ownerUserId?: string
  issuedBy?: string
  affiliateCode?: string
  ttlDays?: number | null           // override default TTL
  metadata?: Record<string, unknown>
}

export async function createActivationKey(opts: CreateKeyOptions): Promise<ActivationKey> {
  const {
    type,
    plan,
    ownerUserId,
    issuedBy = 'system',
    affiliateCode,
    ttlDays = DEFAULT_TTL_DAYS[type],
    metadata = {},
  } = opts

  if (type === 'affiliate' && !affiliateCode) {
    throw new Error('affiliateCode is required for affiliate keys')
  }

  const key = formatKey(type)

  const { data, error } = await supabaseAdmin
    .from('activation_keys')
    .insert({
      key,
      key_type: type,
      plan,
      owner_user_id: ownerUserId ?? null,
      issued_by: issuedBy,
      affiliate_code: affiliateCode ?? null,
      expires_at: expiresAt(ttlDays),
      metadata,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create activation key: ${error.message}`)
  return data as ActivationKey
}

// ─── Validate ─────────────────────────────────────────────────────────────────

/**
 * Fetch a key record and check it is usable.
 * Throws KeyActivationError with a typed reason if not.
 */
export async function validateKey(keyStr: string): Promise<ActivationKey> {
  const { data, error } = await supabaseAdmin
    .from('activation_keys')
    .select('*')
    .eq('key', keyStr.trim().toUpperCase())
    .maybeSingle()

  if (error || !data) {
    throw new KeyActivationError('not_found', 'Chave de ativação não encontrada.')
  }

  const record = data as ActivationKey

  if (record.revoked) {
    throw new KeyActivationError('revoked', 'Esta chave foi revogada.')
  }

  if (record.used_at !== null) {
    throw new KeyActivationError('already_used', 'Esta chave já foi utilizada.')
  }

  if (record.expires_at && new Date(record.expires_at) < new Date()) {
    throw new KeyActivationError('expired', 'Esta chave expirou.')
  }

  return record
}

// ─── Activate ─────────────────────────────────────────────────────────────────

/**
 * Atomically mark the key as used and activate the plan for the user.
 * Throws KeyActivationError if the key is invalid/used/expired/revoked.
 * Idempotent for the same user: returns the existing activation if already done.
 */
export async function activateKey(
  keyStr: string,
  userId: string
): Promise<ActivateResult> {
  const record = await validateKey(keyStr)

  // Atomic update: set used_at + used_by_user_id in a single statement
  // The WHERE clause re-checks the conditions to prevent race conditions
  const { data: updated, error } = await supabaseAdmin
    .from('activation_keys')
    .update({
      used_at: new Date().toISOString(),
      used_by_user_id: userId,
    })
    .eq('id', record.id)
    .is('used_at', null)           // re-verify single-use atomically
    .eq('revoked', false)
    .select()
    .maybeSingle()

  if (error || !updated) {
    // Another request beat us — fetch current state to return the right error
    const { data: current } = await supabaseAdmin
      .from('activation_keys')
      .select('used_by_user_id, used_at')
      .eq('id', record.id)
      .single()

    if (current?.used_by_user_id === userId) {
      // Same user re-activated — idempotent, treat as success
      const activatedRecord = { ...record, used_at: current.used_at, used_by_user_id: userId }
      await applyPlan(userId, record.plan, record.key_type, record.expires_at)
      return { success: true, key: activatedRecord, planActivated: record.plan, expiresAt: record.expires_at }
    }

    throw new KeyActivationError('already_used', 'Esta chave já foi utilizada por outro usuário.')
  }

  // Apply plan to user profile
  await applyPlan(userId, record.plan, record.key_type, record.expires_at)

  const activatedRecord = updated as ActivationKey

  return {
    success: true,
    key: activatedRecord,
    planActivated: record.plan,
    expiresAt: record.expires_at,
  }
}

// ─── Plan application ─────────────────────────────────────────────────────────

async function applyPlan(
  userId: string,
  plan: string,
  keyType: KeyType,
  expiresAt: string | null
) {
  await supabaseAdmin
    .from('profiles')
    .update({
      plan,
      // Store trial/affiliate expiry on profile so middleware can enforce it
      plan_expires_at: keyType !== 'payment' ? expiresAt : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
}

// ─── Get ──────────────────────────────────────────────────────────────────────

/** Latest active (not revoked, not expired) key owned by a user for a plan. */
export async function getActiveKeyForUser(
  userId: string,
  plan: string
): Promise<ActivationKey | null> {
  const { data } = await supabaseAdmin
    .from('activation_keys')
    .select('*')
    .eq('owner_user_id', userId)
    .eq('plan', plan)
    .eq('revoked', false)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data as ActivationKey | null)
}

/** All keys a user has ever used or owns. */
export async function listKeysForUser(userId: string): Promise<ActivationKey[]> {
  const { data } = await supabaseAdmin
    .from('activation_keys')
    .select('*')
    .or(`owner_user_id.eq.${userId},used_by_user_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  return (data ?? []) as ActivationKey[]
}

// ─── Revoke ───────────────────────────────────────────────────────────────────

export async function revokeKey(
  keyId: string,
  reason: string
): Promise<void> {
  await supabaseAdmin
    .from('activation_keys')
    .update({ revoked: true, revoked_at: new Date().toISOString(), revoked_reason: reason })
    .eq('id', keyId)
}

/** Revoke all unused keys for a user (e.g. on subscription cancellation). */
export async function revokeUnusedKeysForUser(
  userId: string,
  reason = 'subscription_cancelled'
): Promise<void> {
  await supabaseAdmin
    .from('activation_keys')
    .update({ revoked: true, revoked_at: new Date().toISOString(), revoked_reason: reason })
    .eq('owner_user_id', userId)
    .is('used_at', null)
    .eq('revoked', false)
}
