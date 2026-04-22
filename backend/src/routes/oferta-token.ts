// ─── Links Mágicos de Oferta de Sessão Gratuita ───────────────
// POST /oferta/admin/criar          — admin: gerar token
// GET  /oferta/admin/listar         — admin: listar tokens activos
// DELETE /oferta/admin/:id          — admin: desactivar token
// POST /oferta/terapeuta/criar      — terapeuta JWT: gerar token próprio
// GET  /oferta/terapeuta/listar     — terapeuta JWT: listar tokens próprios
// DELETE /oferta/terapeuta/:id      — terapeuta JWT: desactivar token próprio
// GET  /oferta/:token               — público: info do token
// POST /oferta/:token/resgatar      — público: criar crédito e devolver URL

import { Router, Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '../lib/supabase'

const router = Router()

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://euthycare.com'
const JWT_SECRET = process.env.TERAPEUTA_JWT_SECRET ?? 'euthycare-terapeuta-secret-change-me'

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: 'Acesso negado' }); return
  }
  next()
}

declare module 'express-serve-static-core' {
  interface Request { terapeutaId?: string }
}

function requireTerapeutaJwt(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers['authorization']
  if (!auth?.startsWith('Bearer ')) { res.status(401).json({ error: 'Token não fornecido' }); return }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { sub: string }
    req.terapeutaId = payload.sub
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}

function gerarToken() {
  return crypto.randomBytes(6).toString('hex') // 12 chars hex
}

// ─── Admin: criar token ───────────────────────────────────────
router.post('/admin/criar', requireAdmin, async (req: Request, res: Response) => {
  const { terapeuta_slug, sessoes = 1, validade_dias = 30, usos_max = 1 } = req.body

  // Resolver terapeuta_id a partir do slug, se fornecido
  let terapeuta_id: string | null = null
  if (terapeuta_slug) {
    const { data } = await supabaseAdmin
      .from('terapeutas')
      .select('id')
      .eq('slug', terapeuta_slug)
      .single()
    terapeuta_id = data?.id ?? null
  }

  const token = gerarToken()

  const { data, error } = await supabaseAdmin
    .from('ofertas_token')
    .insert({
      token,
      terapeuta_id,
      terapeuta_slug: terapeuta_slug ?? null,
      sessoes:        Number(sessoes),
      validade_dias:  Number(validade_dias),
      usos_max:       usos_max === null ? null : Number(usos_max),
    })
    .select()
    .single()

  if (error) { res.status(500).json({ error: error.message }); return }

  const url = `${SITE}/oferta/${token}`
  res.json({ ...data, url })
})

// ─── Admin: listar tokens ─────────────────────────────────────
router.get('/admin/listar', requireAdmin, async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('ofertas_token')
    .select('*')
    .eq('ativo', true)
    .order('criado_em', { ascending: false })

  if (error) { res.status(500).json({ error: error.message }); return }

  const comUrl = (data ?? []).map(t => ({ ...t, url: `${SITE}/oferta/${t.token}` }))
  res.json(comUrl)
})

// ─── Admin: desactivar token ──────────────────────────────────
router.delete('/admin/:id', requireAdmin, async (req: Request, res: Response) => {
  const { error } = await supabaseAdmin
    .from('ofertas_token')
    .update({ ativo: false })
    .eq('id', req.params.id)

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json({ ok: true })
})

// ─── Terapeuta: criar token próprio ──────────────────────────
router.post('/terapeuta/criar', requireTerapeutaJwt, async (req: Request, res: Response) => {
  const { sessoes = 1, validade_dias = 30, usos_max = 1 } = req.body

  // Resolver slug e id da terapeuta autenticada
  const { data: t } = await supabaseAdmin
    .from('terapeutas')
    .select('id, slug')
    .eq('id', req.terapeutaId!)
    .single()

  if (!t) { res.status(404).json({ error: 'Terapeuta não encontrada.' }); return }

  const token = gerarToken()
  const { data, error } = await supabaseAdmin
    .from('ofertas_token')
    .insert({
      token,
      terapeuta_id:   t.id,
      terapeuta_slug: t.slug ?? null,
      sessoes:        Number(sessoes),
      validade_dias:  Number(validade_dias),
      usos_max:       usos_max === null ? null : Number(usos_max),
    })
    .select().single()

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json({ ...data, url: `${SITE}/oferta/${token}` })
})

// ─── Terapeuta: listar tokens próprios ───────────────────────
router.get('/terapeuta/listar', requireTerapeutaJwt, async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('ofertas_token')
    .select('*')
    .eq('terapeuta_id', req.terapeutaId!)
    .eq('ativo', true)
    .order('criado_em', { ascending: false })

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json((data ?? []).map(t => ({ ...t, url: `${SITE}/oferta/${t.token}` })))
})

// ─── Terapeuta: desactivar token próprio ─────────────────────
router.delete('/terapeuta/:id', requireTerapeutaJwt, async (req: Request, res: Response) => {
  // Verificar que o token pertence a esta terapeuta
  const { data: existing } = await supabaseAdmin
    .from('ofertas_token')
    .select('id')
    .eq('id', req.params.id)
    .eq('terapeuta_id', req.terapeutaId!)
    .single()

  if (!existing) { res.status(403).json({ error: 'Acesso negado.' }); return }

  const { error } = await supabaseAdmin
    .from('ofertas_token')
    .update({ ativo: false })
    .eq('id', req.params.id)

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json({ ok: true })
})

// ─── Público: info do token ───────────────────────────────────
router.get('/:token', async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('ofertas_token')
    .select('token, sessoes, validade_dias, usos_max, usos_total, terapeuta_slug')
    .eq('token', req.params.token)
    .eq('ativo', true)
    .single()

  if (error || !data) { res.status(404).json({ error: 'Link inválido ou expirado.' }); return }

  if (data.usos_max !== null && data.usos_total >= data.usos_max) {
    res.status(410).json({ error: 'Este link já foi utilizado.' }); return
  }

  res.json({
    sessoes:       data.sessoes,
    validade_dias: data.validade_dias,
    terapeuta_slug: data.terapeuta_slug,
  })
})

// ─── Público: resgatar token (cria crédito) ───────────────────
router.post('/:token/resgatar', async (req: Request, res: Response) => {
  const { nome, email } = req.body

  if (!email) { res.status(400).json({ error: 'email obrigatório' }); return }

  // Buscar token e validar
  const { data: oferta, error: errOferta } = await supabaseAdmin
    .from('ofertas_token')
    .select('*')
    .eq('token', req.params.token)
    .eq('ativo', true)
    .single()

  if (errOferta || !oferta) {
    res.status(404).json({ error: 'Link inválido ou expirado.' }); return
  }

  if (oferta.usos_max !== null && oferta.usos_total >= oferta.usos_max) {
    res.status(410).json({ error: 'Este link já foi utilizado.' }); return
  }

  // Criar crédito
  const validade = new Date()
  validade.setDate(validade.getDate() + oferta.validade_dias)

  const { error: errCredito } = await supabaseAdmin.from('creditos_cliente').insert({
    cliente_email:     email,
    cliente_nome:      nome ?? '',
    pacote_id:         null,
    terapeuta_id:      oferta.terapeuta_id ?? null,
    sessoes_total:     oferta.sessoes,
    sessoes_restantes: oferta.sessoes,
    validade:          validade.toISOString().slice(0, 10),
    stripe_payment_id: null,
    status:            'ativo',
    valor_pago_cents:  0,
    comissao_cents:    0,
    repasse_cents:     0,
    repasse_pago:      false,
  })

  if (errCredito) { res.status(500).json({ error: errCredito.message }); return }

  // Incrementar usos do token
  await supabaseAdmin
    .from('ofertas_token')
    .update({ usos_total: oferta.usos_total + 1 })
    .eq('id', oferta.id)

  // Redirecionar para agendamento com email pré-carregado
  const emailParam = encodeURIComponent(email)
  const url = oferta.terapeuta_slug
    ? `${SITE}/t/${oferta.terapeuta_slug}?sucesso=1`
    : `${SITE}/agendamento?sucesso=1&email=${emailParam}`

  res.json({ ok: true, url })
})

export default router
