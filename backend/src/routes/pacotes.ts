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

  // Buscar dados da terapeuta (comissão + conta Stripe Connect)
  let stripeAccountId: string | null = null
  let comissaoCents = 0
  const valorCents = Math.round(pacote.preco * 100)

  if (terapeuta_id) {
    const { data: tData } = await supabaseAdmin
      .from('terapeutas')
      .select('comissao_percentagem, stripe_account_id, stripe_onboarded')
      .eq('id', terapeuta_id)
      .single()
    if (tData) {
      comissaoCents = Math.round(valorCents * tData.comissao_percentagem / 100)
      // Usar Stripe Connect só se a conta estiver totalmente onboarded
      if (tData.stripe_account_id && tData.stripe_onboarded) {
        stripeAccountId = tData.stripe_account_id as string
      }
    }
  }

  // URLs de retorno: página da terapeuta ou agendamento geral
  const base = terapeuta_slug
    ? `https://euthycare.com/t/${terapeuta_slug}`
    : 'https://euthycare.com/agendamento'
  const safeSuccess = `${base}?sucesso=1`
  const safeCancel  = base

  let session: Stripe.Checkout.Session
  try {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
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
          unit_amount: valorCents,
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
    }

    // Se a terapeuta tem Stripe Connect ativo: destination charge com repasse automático
    if (stripeAccountId && comissaoCents > 0) {
      sessionParams.payment_intent_data = {
        application_fee_amount: comissaoCents,
        transfer_data: { destination: stripeAccountId },
      }
    }

    session = await stripe.checkout.sessions.create(sessionParams)
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

// ─── Terapeuta: enviar proposta de tratamento ao cliente ──────
router.post('/meus/:id/enviar-cliente', requireTerapeutaJwt, async (req: Request, res: Response) => {
  const RESEND_KEY = process.env.RESEND_API_KEY
  const FROM_EMAIL = 'noreply@euthycare.com'
  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://euthycare.com'

  // Verificar posse do pacote
  const { data: pacote } = await supabaseAdmin.from('pacotes')
    .select('id, nome, numero_sessoes, duracao_min, preco, descricao, terapeuta_id')
    .eq('id', req.params.id).single()
  if (!pacote || pacote.terapeuta_id !== req.terapeutaId) {
    res.status(403).json({ error: 'Sem permissão' }); return
  }

  const { cliente_email, cliente_nome, terapeuta_nome, terapeuta_slug } = req.body
  if (!cliente_email || !terapeuta_slug) {
    res.status(400).json({ error: 'cliente_email e terapeuta_slug são obrigatórios' }); return
  }

  const linkPagamento = `${SITE}/t/${terapeuta_slug}?pacote=${pacote.id}`

  if (!RESEND_KEY) { res.status(500).json({ error: 'Email não configurado.' }); return }

  const html = `
  <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#2d4534">
    <h2 style="color:#5c8a6b">EuthyCare</h2>
    <p>Olá${cliente_nome ? ` <strong>${cliente_nome}</strong>` : ''},</p>
    <p><strong>${terapeuta_nome ?? 'A sua terapeuta'}</strong> preparou um plano de tratamento personalizado para si.</p>
    <div style="background:#f2f7f4;border-radius:12px;padding:16px 20px;margin:20px 0">
      <p style="margin:0;font-size:16px;font-weight:600;color:#2d4534">${pacote.nome}</p>
      <p style="margin:8px 0 0;color:#555">${pacote.numero_sessoes} sessão${pacote.numero_sessoes > 1 ? 'ões' : ''} de ${pacote.duracao_min} min · ${pacote.preco}€</p>
      ${pacote.descricao ? `<p style="margin:12px 0 0;font-size:13px;color:#666;line-height:1.6">${pacote.descricao}</p>` : ''}
    </div>
    <a href="${linkPagamento}" style="display:inline-block;background:#5c8a6b;color:#fff;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:600;font-size:15px;margin-top:8px">
      Ver e pagar o plano de tratamento
    </a>
    <p style="font-size:12px;color:#555;margin-top:10px">
      🔗 Ou aceda directamente: <a href="${linkPagamento}" style="color:#5c8a6b">${linkPagamento}</a>
    </p>
    <hr style="border:none;border-top:1px solid #e0ede5;margin:24px 0">
    <p style="font-size:12px;color:#97c2a8">EuthyCare · euthycare.com</p>
  </div>`

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: cliente_email,
      subject: `Plano de tratamento de ${terapeuta_nome ?? 'EuthyCare'}`,
      html,
    }),
  })

  if (!r.ok) {
    console.error('[pacotes/enviar-cliente] Resend error:', await r.text())
    res.status(500).json({ error: 'Erro ao enviar email.' }); return
  }

  res.json({ ok: true, link: linkPagamento })
})

export default router
