// ─── Pacotes de Consultas ─────────────────────────────────────
// GET  /pacotes                — listar pacotes activos (público)
// GET  /pacotes/creditos?email — verificar créditos do cliente
// POST /pacotes/checkout       — criar sessão de pagamento Stripe
// POST /pacotes/webhook        — webhook Stripe (activar créditos)

import { Router, Request, Response, NextFunction } from 'express'
import Stripe from 'stripe'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '../lib/supabase'

const router = Router()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2025-02-24.acacia' })
const webhookSecret = process.env.STRIPE_PACOTES_WEBHOOK_SECRET ?? ''
const JWT_SECRET = process.env.TERAPEUTA_JWT_SECRET ?? 'euthycare-terapeuta-secret-change-me'

declare module 'express-serve-static-core' {
  interface Request { terapeutaId?: string }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: 'Acesso negado' }); return
  }
  next()
}

function requireTerapeutaJwt(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers['authorization']
  if (!auth?.startsWith('Bearer ')) { res.status(401).json({ error: 'Token não fornecido' }); return }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { sub: string }
    req.terapeutaId = payload.sub
    next()
  } catch { res.status(401).json({ error: 'Token inválido ou expirado' }) }
}

// ─── GET /pacotes — listar pacotes ───────────────────────────
router.get('/', async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('pacotes')
    .select('id, tipo, nome, numero_sessoes, duracao_min, preco, moeda, validade_dias, destaque, descricao')
    .eq('ativo', true)
    .order('preco')

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

// ─── GET /pacotes/creditos?email=... ─────────────────────────
router.get('/creditos', async (req: Request, res: Response) => {
  const { email, terapeuta_id } = req.query
  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'email obrigatório' }); return
  }

  const hoje = new Date().toISOString().slice(0, 10)

  // Expirar créditos vencidos automaticamente
  await supabaseAdmin
    .from('creditos_cliente')
    .update({ status: 'expirado' })
    .eq('cliente_email', email)
    .eq('status', 'ativo')
    .lt('validade', hoje)

  const { data, error } = await supabaseAdmin
    .from('creditos_cliente')
    .select('id, pacote_id, sessoes_total, sessoes_restantes, validade, status, pacotes(nome, tipo)')
    .eq('cliente_email', email)
    .eq('status', 'ativo')
    .gt('validade', hoje)
    .order('validade')

  if (error) { res.status(500).json({ error: error.message }); return }

  // Verificar se o cliente já usou a consulta experimental com esta terapeuta específica
  let expQuery = supabaseAdmin
    .from('creditos_cliente')
    .select('id, pacotes!inner(tipo)')
    .eq('cliente_email', email)
    .eq('pacotes.tipo', 'experimental')
    .limit(1)

  if (terapeuta_id && typeof terapeuta_id === 'string') {
    expQuery = expQuery.eq('terapeuta_id', terapeuta_id)
  }

  const { data: expData } = await expQuery
  const hasExperimental = (expData?.length ?? 0) > 0

  res.json({ creditos: data, hasExperimental, sessoes_restantes: (data ?? []).reduce((acc, c) => acc + c.sessoes_restantes, 0) })
})

// ─── GET /pacotes/public/:id — pacote específico por ID (link directo) ──
router.get('/public/:id', async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('pacotes')
    .select('id, tipo, nome, numero_sessoes, duracao_min, preco, moeda, validade_dias, destaque, descricao')
    .eq('id', req.params.id)
    .eq('ativo', true)
    .single()
  if (error || !data) { res.status(404).json({ error: 'Pacote não encontrado' }); return }
  res.json(data)
})

// ─── POST /pacotes/checkout — criar sessão Stripe (ou crédito gratuito) ──
router.post('/checkout', async (req: Request, res: Response) => {
  const { pacote_id, email, nome, terapeuta_id, terapeuta_slug } = req.body

  if (!pacote_id || !email) {
    res.status(400).json({ error: 'pacote_id e email são obrigatórios' }); return
  }

  const { data: pacote, error: errPacote } = await supabaseAdmin
    .from('pacotes')
    .select('*')
    .eq('id', pacote_id)
    .eq('ativo', true)
    .single()

  if (errPacote || !pacote) {
    res.status(404).json({ error: 'Pacote não encontrado' }); return
  }

  // Consulta experimental: verificar se o cliente já comprou com esta terapeuta
  if (pacote.tipo === 'experimental') {
    let expCheck = supabaseAdmin
      .from('creditos_cliente')
      .select('id')
      .eq('cliente_email', email)
      .eq('pacote_id', pacote_id)
      .limit(1)

    if (terapeuta_id) expCheck = expCheck.eq('terapeuta_id', terapeuta_id)

    const { data: jaComprou } = await expCheck

    if (jaComprou && jaComprou.length > 0) {
      res.status(409).json({ error: 'A consulta experimental já foi utilizada com esta terapeuta.' })
      return
    }
  }

  // Pacote gratuito: criar crédito directamente sem Stripe
  if (Number(pacote.preco) === 0) {
    const validade = new Date()
    validade.setDate(validade.getDate() + pacote.validade_dias)
    const { error: errCredito } = await supabaseAdmin.from('creditos_cliente').insert({
      cliente_email:     email,
      cliente_nome:      nome ?? '',
      pacote_id,
      terapeuta_id:      terapeuta_id || null,
      sessoes_total:     pacote.numero_sessoes,
      sessoes_restantes: pacote.numero_sessoes,
      validade:          validade.toISOString().slice(0, 10),
      stripe_payment_id: null,
      status:            'ativo',
      valor_pago_cents:  0,
      comissao_cents:    0,
      repasse_cents:     0,
      repasse_pago:      false,
    })
    if (errCredito) { res.status(500).json({ error: errCredito.message }); return }
    const base = terapeuta_slug ? `https://euthycare.com/t/${terapeuta_slug}` : 'https://euthycare.com/agendamento'
    res.json({ url: `${base}?sucesso=1`, free: true }); return
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(500).json({ error: 'Pagamento não configurado. Contacte o suporte.' }); return
  }

  // URLs de retorno: página da terapeuta ou agendamento geral
  const base = terapeuta_slug
    ? `https://euthycare.com/t/${terapeuta_slug}`
    : 'https://euthycare.com/agendamento'
  const safeSuccess = `${base}?sucesso=1`
  const safeCancel  = base

  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [{
        price_data: {
          currency: pacote.moeda.toLowerCase(),
          product_data: {
            name:        `${pacote.nome} — ${pacote.numero_sessoes} sessões`,
            description: pacote.descricao ?? undefined,
            metadata:    { pacote_id: pacote.id },
          },
          unit_amount: Math.round(pacote.preco * 100),
        },
        quantity: 1,
      }],
      metadata: {
        pacote_id:     pacote.id,
        cliente_email: email,
        cliente_nome:  nome ?? '',
        terapeuta_id:  terapeuta_id ?? '',
      },
      success_url: safeSuccess,
      cancel_url:  safeCancel,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao criar sessão de pagamento'
    console.error('[pacotes/checkout] Stripe error:', msg)
    res.status(500).json({ error: msg }); return
  }

  res.json({ url: session.url })
})

// ─── POST /pacotes/webhook — Stripe webhook ───────────────────
// Registar no Stripe: evento checkout.session.completed
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature']
  if (!sig) { res.status(400).send('Missing signature'); return }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret)
  } catch (err) {
    res.status(400).send(`Webhook error: ${(err as Error).message}`); return
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { pacote_id, cliente_email, cliente_nome, terapeuta_id } = session.metadata ?? {}

    if (!pacote_id || !cliente_email) {
      res.json({ received: true }); return
    }

    const { data: pacote } = await supabaseAdmin
      .from('pacotes')
      .select('numero_sessoes, validade_dias, preco')
      .eq('id', pacote_id)
      .single()

    if (pacote) {
      const validade = new Date()
      validade.setDate(validade.getDate() + pacote.validade_dias)

      // ── Calcular comissão ──────────────────────────────────
      const valorPagoCents = Math.round(Number(pacote.preco) * 100)
      let comissaoCents = 0
      let repasseCents  = valorPagoCents

      if (terapeuta_id) {
        const { data: t } = await supabaseAdmin
          .from('terapeutas')
          .select('comissao_percentagem')
          .eq('id', terapeuta_id)
          .single()
        if (t) {
          comissaoCents = Math.round(valorPagoCents * t.comissao_percentagem / 100)
          repasseCents  = valorPagoCents - comissaoCents
        }
      }

      await supabaseAdmin.from('creditos_cliente').insert({
        cliente_email,
        cliente_nome:      cliente_nome ?? '',
        pacote_id,
        terapeuta_id:      terapeuta_id || null,
        sessoes_total:     pacote.numero_sessoes,
        sessoes_restantes: pacote.numero_sessoes,
        validade:          validade.toISOString().slice(0, 10),
        stripe_payment_id: session.payment_intent as string,
        status:            'ativo',
        valor_pago_cents:  valorPagoCents,
        comissao_cents:    comissaoCents,
        repasse_cents:     repasseCents,
        repasse_pago:      false,
      })
    }
  }

  res.json({ received: true })
})

// ─── Admin: criar crédito de oferta (sessão gratuita manual) ──
router.post('/admin/credito-oferta', requireAdmin, async (req: Request, res: Response) => {
  const { email, nome, terapeuta_id, terapeuta_slug, sessoes = 1, validade_dias = 30 } = req.body
  if (!email) { res.status(400).json({ error: 'email obrigatório' }); return }

  const validade = new Date()
  validade.setDate(validade.getDate() + Number(validade_dias))

  const { error } = await supabaseAdmin.from('creditos_cliente').insert({
    cliente_email:     email,
    cliente_nome:      nome ?? '',
    pacote_id:         null,
    terapeuta_id:      terapeuta_id || null,
    sessoes_total:     Number(sessoes),
    sessoes_restantes: Number(sessoes),
    validade:          validade.toISOString().slice(0, 10),
    stripe_payment_id: null,
    status:            'ativo',
    tipo_origem:       'oferta',
    valor_pago_cents:  0,
    comissao_cents:    0,
    repasse_cents:     0,
    repasse_pago:      false,
  })

  if (error) { res.status(500).json({ error: error.message }); return }

  const base = terapeuta_slug ? `https://euthycare.com/t/${terapeuta_slug}` : 'https://euthycare.com/agendamento'
  res.json({ ok: true, url: base })
})

// ─── Admin: listar créditos ───────────────────────────────────
router.get('/admin/creditos', requireAdmin, async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('creditos_cliente')
    .select('*, pacotes(nome)')
    .order('criado_em', { ascending: false })

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

// ─── Admin: CRUD pacotes por terapeuta ────────────────────────
router.get('/admin/terapeuta/:id', requireAdmin, async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('pacotes')
    .select('id, tipo, nome, numero_sessoes, duracao_min, preco, moeda, validade_dias, destaque, descricao, ativo, publico')
    .eq('terapeuta_id', req.params.id)
    .order('preco')
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data ?? [])
})

router.post('/admin', requireAdmin, async (req: Request, res: Response) => {
  const { terapeuta_id, tipo, nome, numero_sessoes, duracao_min, preco, validade_dias, destaque, descricao, publico } = req.body
  if (!terapeuta_id || !nome || !numero_sessoes || validade_dias === undefined) {
    res.status(400).json({ error: 'terapeuta_id, nome, numero_sessoes e validade_dias são obrigatórios' }); return
  }
  const { data, error } = await supabaseAdmin.from('pacotes').insert({
    terapeuta_id,
    tipo: tipo ?? 'pacote',
    nome,
    numero_sessoes: Number(numero_sessoes),
    duracao_min: Number(duracao_min ?? 50),
    preco: Number(preco ?? 0),
    moeda: 'EUR',
    validade_dias: Number(validade_dias),
    destaque: destaque ?? false,
    descricao: descricao ?? null,
    publico: publico !== false,
    ativo: true,
  }).select().single()
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

router.patch('/admin/:id', requireAdmin, async (req: Request, res: Response) => {
  const allowed = ['tipo','nome','numero_sessoes','duracao_min','preco','validade_dias','destaque','descricao','ativo','publico']
  const update: Record<string, unknown> = {}
  for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k]
  const { data, error } = await supabaseAdmin.from('pacotes').update(update).eq('id', req.params.id).select().single()
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

router.delete('/admin/:id', requireAdmin, async (req: Request, res: Response) => {
  const { error } = await supabaseAdmin.from('pacotes').delete().eq('id', req.params.id)
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json({ ok: true })
})

// ─── Terapeuta: gerir os seus próprios pacotes (JWT) ──────────
router.get('/meus', requireTerapeutaJwt, async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('pacotes')
    .select('id, tipo, nome, numero_sessoes, duracao_min, preco, moeda, validade_dias, destaque, descricao, ativo, publico')
    .eq('terapeuta_id', req.terapeutaId!)
    .order('preco')
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data ?? [])
})

router.post('/meus', requireTerapeutaJwt, async (req: Request, res: Response) => {
  const { tipo, nome, numero_sessoes, duracao_min, preco, validade_dias, destaque, descricao, publico } = req.body
  if (!nome || !numero_sessoes || validade_dias === undefined) {
    res.status(400).json({ error: 'nome, numero_sessoes e validade_dias são obrigatórios' }); return
  }
  const { data, error } = await supabaseAdmin.from('pacotes').insert({
    terapeuta_id:   req.terapeutaId!,
    tipo:           tipo ?? 'pacote',
    nome,
    numero_sessoes: Number(numero_sessoes),
    duracao_min:    Number(duracao_min ?? 50),
    preco:          Number(preco ?? 0),
    moeda:          'EUR',
    validade_dias:  Number(validade_dias),
    destaque:       destaque ?? false,
    descricao:      descricao ?? null,
    publico:        publico !== false,
    ativo:          true,
  }).select().single()
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

router.patch('/meus/:id', requireTerapeutaJwt, async (req: Request, res: Response) => {
  // Verificar que o pacote pertence à terapeuta autenticada
  const { data: pacote } = await supabaseAdmin.from('pacotes').select('terapeuta_id').eq('id', req.params.id).single()
  if (!pacote || pacote.terapeuta_id !== req.terapeutaId) {
    res.status(403).json({ error: 'Sem permissão para editar este pacote' }); return
  }
  const allowed = ['tipo','nome','numero_sessoes','duracao_min','preco','validade_dias','destaque','descricao','ativo','publico']
  const update: Record<string, unknown> = {}
  for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k]
  const { data, error } = await supabaseAdmin.from('pacotes').update(update).eq('id', req.params.id).select().single()
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

router.delete('/meus/:id', requireTerapeutaJwt, async (req: Request, res: Response) => {
  const { data: pacote } = await supabaseAdmin.from('pacotes').select('terapeuta_id').eq('id', req.params.id).single()
  if (!pacote || pacote.terapeuta_id !== req.terapeutaId) {
    res.status(403).json({ error: 'Sem permissão para eliminar este pacote' }); return
  }
  const { error } = await supabaseAdmin.from('pacotes').delete().eq('id', req.params.id)
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json({ ok: true })
})

export default router
