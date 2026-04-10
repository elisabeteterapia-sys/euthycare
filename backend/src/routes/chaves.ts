// ─── Routes: /chaves ──────────────────────────────────────────
// Public:  POST /chaves/check        — validate without activating
//          POST /chaves/activate     — activate key for calling user
// User:    GET  /chaves/minha        — key used by logged-in user
// Admin:   POST /chaves/admin/gerar  — generate keys (bulk)
//          GET  /chaves/admin/list   — list all keys with filters
//          POST /chaves/admin/revogar — revoke by id or codigo
// Admin auth: x-admin-secret header must match ADMIN_SECRET env var

import { Router, Request, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import {
  createChave,
  createChavesBulk,
  activateChave,
  validateChave,
  revokeChave,
  revokeChavesByCodigos,
  getChaveByUser,
  listChaves,
  ChaveError,
  ChaveTipo,
} from '../lib/chaves'

const router = Router()

// ── Admin auth helper ─────────────────────────────────────────

function isAdmin(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  return req.headers['x-admin-secret'] === secret
}

function adminOnly(req: Request, res: Response): boolean {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'Acesso restrito à administração.' })
    return false
  }
  return true
}

// ── POST /chaves/check ────────────────────────────────────────
// Body: { codigo: string }
// Returns validity info without consuming the key

router.post('/check', async (req: Request, res: Response) => {
  const { codigo } = req.body
  if (!codigo) {
    res.status(400).json({ error: 'codigo é obrigatório.' })
    return
  }

  try {
    const chave = await validateChave(codigo)
    res.json({
      valid: true,
      tipo: chave.tipo,
      planoId: chave.plano_id,
      limiteTerapeutasCustom: chave.limite_terapeutas_custom,
      recursosCustom: chave.recursos_custom_json,
      expiresAt: chave.expirado_em,
    })
  } catch (err) {
    if (err instanceof ChaveError) {
      res.status(422).json({ valid: false, reason: err.reason, error: err.message })
    } else {
      res.status(500).json({ valid: false, reason: 'server_error', error: 'Erro interno.' })
    }
  }
})

// ── POST /chaves/activate ─────────────────────────────────────
// Body: { codigo: string }
// Requires auth

router.post('/activate', requireAuth, async (req: AuthRequest, res: Response) => {
  const { codigo } = req.body
  if (!codigo) {
    res.status(400).json({ error: 'codigo é obrigatório.' })
    return
  }

  try {
    const result = await activateChave(codigo, req.user!.id)
    res.json({
      success: true,
      planoId:                     result.planoId,
      limiteTerapeutasEfetivo:     result.limiteTerapeutasEfetivo,
      recursosCustom:              result.recursosCustom,
      expiresAt:                   result.expiresAt,
    })
  } catch (err) {
    if (err instanceof ChaveError) {
      const status = err.reason === 'not_found' ? 404 : 422
      res.status(status).json({ error: err.message, reason: err.reason })
    } else {
      console.error('[/chaves/activate]', err)
      res.status(500).json({ error: 'Erro interno ao ativar chave.' })
    }
  }
})

// ── GET /chaves/minha ─────────────────────────────────────────
// Returns the activation key used by the current user

router.get('/minha', requireAuth, async (req: AuthRequest, res: Response) => {
  const chave = await getChaveByUser(req.user!.id)
  if (!chave) {
    res.status(404).json({ error: 'Nenhuma chave ativa encontrada.' })
    return
  }
  res.json({
    codigo:                  chave.codigo,
    tipo:                    chave.tipo,
    planoId:                 chave.plano_id,
    limiteTerapeutasCustom:  chave.limite_terapeutas_custom,
    recursosCustom:          chave.recursos_custom_json,
    expiresAt:               chave.expirado_em,
    usadoEm:                 chave.usado_em,
  })
})

// ── POST /chaves/admin/gerar ──────────────────────────────────
// Body: {
//   tipo: ChaveTipo,
//   planoId?: string,
//   limiteTerapeutasCustom?: number,
//   recursosCustom?: object,
//   validadeDias?: number,
//   quantidade?: number (max 100)
// }

router.post('/admin/gerar', async (req: Request, res: Response) => {
  if (!adminOnly(req, res)) return

  const {
    tipo,
    planoId              = null,
    limiteTerapeutasCustom = null,
    recursosCustom       = {},
    validadeDias         = undefined,
    quantidade           = 1,
  } = req.body

  if (!tipo) {
    res.status(400).json({ error: 'tipo é obrigatório.' })
    return
  }

  const validTypes: ChaveTipo[] = [
    'trial_30_dias', 'pos_pagamento', 'parceiro_futuro',
    'upgrade_plano', 'clinica_especial', 'enterprise',
  ]

  if (!validTypes.includes(tipo)) {
    res.status(400).json({ error: `tipo inválido. Válidos: ${validTypes.join(', ')}` })
    return
  }

  const qty = Math.min(Math.max(parseInt(quantidade, 10) || 1, 1), 100)

  try {
    const chaves = await createChavesBulk(
      { tipo, planoId, limiteTerapeutasCustom, recursosCustom, validadeDias, criadoPor: 'admin' },
      qty
    )

    res.json({
      geradas: chaves.length,
      chaves: chaves.map((c) => ({
        id: c.id,
        codigo: c.codigo,
        tipo: c.tipo,
        planoId: c.plano_id,
        limiteTerapeutasCustom: c.limite_terapeutas_custom,
        expiresAt: c.expirado_em,
      })),
    })
  } catch (err) {
    console.error('[/chaves/admin/gerar]', err)
    res.status(500).json({ error: 'Erro ao gerar chaves.' })
  }
})

// ── GET /chaves/admin/list ────────────────────────────────────
// Query: tipo?, planoId?, usado?, revogado?, limit?

router.get('/admin/list', async (req: Request, res: Response) => {
  if (!adminOnly(req, res)) return

  const {
    tipo,
    planoId,
    usado,
    revogado,
    limit = '50',
  } = req.query as Record<string, string>

  const chaves = await listChaves({
    tipo:     tipo as ChaveTipo | undefined,
    planoId,
    usado:    usado    !== undefined ? usado    === 'true' : undefined,
    revogado: revogado !== undefined ? revogado === 'true' : undefined,
    limit:    parseInt(limit, 10) || 50,
  })

  res.json({ total: chaves.length, chaves })
})

// ── POST /chaves/admin/revogar ────────────────────────────────
// Body: { id?: string, codigos?: string[], motivo?: string }

router.post('/admin/revogar', async (req: Request, res: Response) => {
  if (!adminOnly(req, res)) return

  const { id, codigos, motivo = 'revogado_pelo_admin' } = req.body

  if (!id && (!codigos || codigos.length === 0)) {
    res.status(400).json({ error: 'Forneça id ou codigos[].' })
    return
  }

  try {
    if (id) {
      await revokeChave(id, motivo)
      res.json({ revogado: true, id })
    } else {
      await revokeChavesByCodigos(codigos, motivo)
      res.json({ revogados: codigos.length, codigos })
    }
  } catch (err) {
    console.error('[/chaves/admin/revogar]', err)
    res.status(500).json({ error: 'Erro ao revogar chaves.' })
  }
})

export default router
