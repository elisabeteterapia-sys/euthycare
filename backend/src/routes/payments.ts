/**
 * /payments — rotas de pagamento auxiliares
 *
 * Inclui endpoints de simulação para desenvolvimento e testes.
 * Os endpoints de /simulate/* são bloqueados automaticamente em NODE_ENV=production.
 */

import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase'
import {
  createActivationKey,
  activateKey,
  revokeUnusedKeysForUser,
} from '../lib/activation'

const router = Router()

// ─── Guard: bloqueia simulações em produção ───────────────────
function devOnly(_req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({
      error: 'Simulações não estão disponíveis em produção.',
      code: 'DEV_ONLY',
    })
    return
  }
  next()
}

// ─── Schema de entrada ────────────────────────────────────────
const simulateSchema = z.object({
  /** ID do usuário que receberá o plano (obrigatório) */
  user_id: z.string().uuid({ message: 'user_id deve ser um UUID válido.' }),

  /** Plano a ativar */
  plan_id: z.enum(['pro', 'enterprise']).default('pro'),

  /** Moeda do "pagamento" simulado */
  currency: z.enum(['EUR', 'USD', 'BRL']).default('EUR'),

  /** Número de telefone MBWay (apenas para log — não é validado em simulação) */
  phone: z.string().regex(/^9\d{8}$/, 'Telefone MBWay deve ter formato 9XXXXXXXX').optional(),

  /** Referência externa simulada (gerada automaticamente se omitida) */
  external_ref: z.string().max(64).optional(),
})

// ─── Helpers internos ─────────────────────────────────────────

function generateMBWayRef(): string {
  return `MBWAY-SIM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

async function resolveUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, plan')
    .eq('id', userId)
    .single()

  if (error || !data) throw new Error(`Usuário não encontrado: ${userId}`)
  return data as { id: string; email: string; plan: string }
}

async function applySimulatedPlan(
  userId: string,
  planId: string,
  externalRef: string,
  currency: string
) {
  // 1. Atualiza perfil
  await supabaseAdmin
    .from('profiles')
    .update({
      plan: planId,
      plan_expires_at: null,
      stripe_customer_id: `sim_cust_${userId.slice(0, 8)}`,
      stripe_subscription_id: externalRef,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  // 2. Revoga chaves não usadas existentes
  await revokeUnusedKeysForUser(userId, 'simulation_replaced')

  // 3. Cria e ativa chave de pagamento
  const keyRecord = await createActivationKey({
    type: 'payment',
    plan: planId as 'pro' | 'enterprise',
    ownerUserId: userId,
    issuedBy: 'mbway-simulation',
    ttlDays: null,
    metadata: { simulated: true, external_ref: externalRef, currency },
  })
  await activateKey(keyRecord.key, userId)

  // 4. Registra log de pagamento simulado
  await supabaseAdmin.from('payment_logs').insert({
    user_id: userId,
    provider: 'mbway',
    event_type: 'subscription.activated',
    status: 'success',
    provider_ref: externalRef,
    amount_cents: planId === 'pro' ? 1900 : 9900,
    currency,
    metadata: { simulated: true },
  })

  return keyRecord
}

// ═══════════════════════════════════════════════════════════════
// POST /payments/mbway/simulate-success
// ═══════════════════════════════════════════════════════════════
/**
 * Simula o recebimento de um webhook de pagamento MBWay bem-sucedido.
 *
 * Fluxo simulado:
 *   1. Valida o corpo da requisição
 *   2. Verifica que o usuário existe
 *   3. Gera uma referência externa simulada
 *   4. Constrói o payload que um agregador real enviaria (Easypay / Ifthenpay)
 *   5. Processa o evento exatamente como o webhook real faria
 *   6. Retorna o estado final do usuário + chave de ativação gerada
 *
 * Uso:
 *   POST /payments/mbway/simulate-success
 *   Content-Type: application/json
 *
 *   { "user_id": "uuid", "plan_id": "pro", "currency": "EUR", "phone": "912345678" }
 */
router.post('/mbway/simulate-success', devOnly, async (req: Request, res: Response) => {
  const parsed = simulateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const { user_id, plan_id, currency, phone, external_ref } = parsed.data
  const externalRef = external_ref ?? generateMBWayRef()

  // Verifica usuário
  let user: { id: string; email: string; plan: string }
  try {
    user = await resolveUser(user_id)
  } catch (err) {
    res.status(404).json({ error: err instanceof Error ? err.message : 'Usuário não encontrado.' })
    return
  }

  // Payload simulado — idêntico ao que um agregador MBWay enviaria via webhook
  const simulatedWebhookPayload = {
    event: 'payment_ok',
    transaction_id: externalRef,
    amount: plan_id === 'pro' ? 19.00 : 99.00,
    currency,
    method: 'mbway',
    phone: phone ?? '9XXXXXXXXX',
    status: 'completed',
    metadata: {
      user_id,
      plan_id,
      provider: 'mbway',
    },
    created_at: new Date().toISOString(),
  }

  // Processa o evento (mesma lógica do webhook real)
  let keyRecord: Awaited<ReturnType<typeof createActivationKey>>
  try {
    keyRecord = await applySimulatedPlan(user_id, plan_id, externalRef, currency)
  } catch (err) {
    console.error('[MBWay simulate] Error applying plan:', err)
    res.status(500).json({
      error: 'Erro ao aplicar o plano simulado.',
      detail: err instanceof Error ? err.message : String(err),
    })
    return
  }

  // Busca estado final do usuário
  const { data: updatedProfile } = await supabaseAdmin
    .from('profiles')
    .select('plan, stripe_subscription_id, updated_at')
    .eq('id', user_id)
    .single()

  res.status(200).json({
    // ── O que foi simulado ──────────────────────────────────────
    simulated: true,
    webhook_payload: simulatedWebhookPayload,

    // ── Resultado ───────────────────────────────────────────────
    result: {
      user_id,
      email: user.email,
      plan_anterior: user.plan,
      plan_atual: updatedProfile?.plan,
      subscription_ref: externalRef,
      activation_key: keyRecord.key,
      key_type: keyRecord.key_type,
      processed_at: new Date().toISOString(),
    },

    // ── Aviso ────────────────────────────────────────────────────
    warning: 'Este endpoint é exclusivo para desenvolvimento. Não está disponível em produção.',
  })
})

// ═══════════════════════════════════════════════════════════════
// POST /payments/mbway/simulate-failure  (bônus)
// ═══════════════════════════════════════════════════════════════
/**
 * Simula uma falha de pagamento MBWay (usuário recusou / timeout).
 * Apenas registra o log de falha — não altera plano nem chaves.
 */
router.post('/mbway/simulate-failure', devOnly, async (req: Request, res: Response) => {
  const { user_id, plan_id = 'pro', currency = 'EUR', reason = 'user_rejected' } = req.body

  if (!user_id) {
    res.status(400).json({ error: 'user_id é obrigatório.' })
    return
  }

  const externalRef = generateMBWayRef()

  await supabaseAdmin.from('payment_logs').insert({
    user_id,
    provider: 'mbway',
    event_type: 'payment.failed',
    status: 'failed',
    provider_ref: externalRef,
    currency,
    metadata: { simulated: true, reason, plan_id },
  })

  res.status(200).json({
    simulated: true,
    result: {
      user_id,
      event: 'payment.failed',
      reason,
      ref: externalRef,
      logged_at: new Date().toISOString(),
    },
    warning: 'Este endpoint é exclusivo para desenvolvimento.',
  })
})

export default router
