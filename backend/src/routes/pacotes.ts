// ─── Pacotes de Consultas ─────────────────────────────────────
// GET  /pacotes                — listar pacotes activos (público)
// GET  /pacotes/creditos?email — verificar créditos do cliente
// POST /pacotes/checkout       — criar sessão de pagamento Stripe
// POST /pacotes/webhook        — webhook Stripe (activar créditos)

import { Router, Request, Response, NextFunction } from 'express'
import Stripe from 'stripe'
import { supabaseAdmin } from '../lib/supabase'

const router = Router()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2025-02-24.acacia' })
const webhookSecret = process.env.STRIPE_PACOTES_WEBHOOK_SECRET ?? ''

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: 'Acesso negado' }); return
  }
  next()
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
  const { email } = req.query
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

  // Verificar se o cliente já usou a consulta experimental (qualquer status)
  const { data: expData } = await supabaseAdmin
    .from('creditos_cliente')
    .select('id, pacotes!inner(tipo)')
    .eq('cliente_email', email)
    .eq('pacotes.tipo', 'experimental')
    .limit(1)

  const hasExperimental = (expData?.length ?? 0) > 0

  res.json({ creditos: data, hasExperimental, sessoes_restantes: (data ?? []).reduce((acc, c) => acc + c.sessoes_restantes, 0) })
})

// ─── POST /pacotes/checkout — criar sessão Stripe ────────────
router.post('/checkout', async (req: Request, res: Response) => {
  const { pacote_id, email, nome, success_url, cancel_url } = req.body

  if (!pacote_id || !email || !success_url) {
    res.status(400).json({ error: 'pacote_id, email e success_url são obrigatórios' }); return
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

  // Consulta experimental: verificar se o cliente já comprou
  if (pacote.tipo === 'experimental') {
    const { data: jaComprou } = await supabaseAdmin
      .from('creditos_cliente')
      .select('id')
      .eq('cliente_email', email)
      .eq('pacote_id', pacote_id)
      .limit(1)

    if (jaComprou && jaComprou.length > 0) {
      res.status(409).json({ error: 'A consulta experimental só pode ser adquirida uma vez por cliente.' })
      return
    }
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(500).json({ error: 'Pagamento não configurado. Contacte o suporte.' }); return
  }

  // Construir URLs de retorno — usar SITE_URL do backend se disponível
  const siteBase = (process.env.FRONTEND_URL ?? process.env.SITE_URL ?? '').replace(/\/$/, '')
  const safeSuccess = siteBase
    ? `${siteBase}/agendamento?sucesso=1`
    : success_url.split('?')[0] + '?sucesso=1'
  const safeCancel  = siteBase
    ? `${siteBase}/agendamento`
    : (cancel_url ?? success_url.split('?')[0])

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
        pacote_id:    pacote.id,
        cliente_email: email,
        cliente_nome:  nome ?? '',
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
    const { pacote_id, cliente_email, cliente_nome } = session.metadata ?? {}

    if (!pacote_id || !cliente_email) {
      res.json({ received: true }); return
    }

    const { data: pacote } = await supabaseAdmin
      .from('pacotes')
      .select('numero_sessoes, validade_dias')
      .eq('id', pacote_id)
      .single()

    if (pacote) {
      const validade = new Date()
      validade.setDate(validade.getDate() + pacote.validade_dias)

      await supabaseAdmin.from('creditos_cliente').insert({
        cliente_email,
        cliente_nome:     cliente_nome ?? '',
        pacote_id,
        sessoes_total:     pacote.numero_sessoes,
        sessoes_restantes: pacote.numero_sessoes,
        validade:          validade.toISOString().slice(0, 10),
        stripe_payment_id: session.payment_intent as string,
        status:            'ativo',
      })
    }
  }

  res.json({ received: true })
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

export default router
