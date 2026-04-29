// ─── Routes: /loja ────────────────────────────────────────────
// GET  /loja/produtos              — list active products (public)
// GET  /loja/produto/:id           — single product detail (public)
// POST /loja/checkout              — create Stripe Checkout session
// GET  /loja/pedido/:sessionId     — resolve order after payment
// GET  /loja/download/:token       — secure download (signed URL, logged, rate-limited)
// POST /loja/webhook/stripe        — Stripe webhook (raw body)
// GET  /loja/admin/pedidos         — order list (admin)
// GET  /loja/admin/downloads       — download log (admin)

import { Router, Request, Response } from 'express'
import Stripe from 'stripe'
import { supabaseAdmin } from '../lib/supabase'

// ─────────────────────────────────────────────────────────────
// SCOPE: download security applies ONLY to this /loja router.
//
//  /euthy-lancamento  → public waitlist form, no auth, no storage
//  /waitlist          → public POST endpoint, no auth, no storage
//  /loja/download     → private, token-gated, signed URL, logged
//
// Do NOT import or reuse DownloadGuard / signedUrl helpers outside
// of this file. The launch page (/euthy-lancamento) has no security.
// ─────────────────────────────────────────────────────────────

// Max downloads per purchase token (lifetime)
const MAX_DOWNLOADS_PER_TOKEN = 10

// IP-level rate limit: max downloads per window (in-memory, per process)
const IP_MAX_PER_WINDOW  = 20
const IP_WINDOW_MS       = 60 * 60 * 1000 // 1 hour
const _ipMap = new Map<string, { count: number; resetAt: number }>()

function checkIpRateLimit(ip: string): boolean {
  const now   = Date.now()
  const entry = _ipMap.get(ip)

  if (!entry || entry.resetAt <= now) {
    _ipMap.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS })
    return true
  }
  if (entry.count >= IP_MAX_PER_WINDOW) return false
  entry.count++
  return true
}

// Clean up stale IP entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of _ipMap) {
    if (entry.resetAt <= now) _ipMap.delete(ip)
  }
}, 10 * 60 * 1000).unref()

const BUCKET = process.env.STORAGE_BUCKET_PRODUTOS ?? 'produtos-pdf'

const router = Router()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

function isAdmin(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  return req.headers['x-admin-secret'] === secret
}

// Token expiry: 7 days from payment
const TOKEN_EXPIRY_DAYS = 7

async function sendDownloadEmail(
  to: string,
  productName: string,
  token: string,
  expiresAt: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping email')
    return
  }

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000'
  const downloadLink = `${frontendUrl}/loja/download/${token}`
  const expiryDate = new Date(expiresAt).toLocaleDateString('pt-PT', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'EuthyCare <noreply@euthycare.com>',
      to: [to],
      subject: `O seu download está pronto — ${productName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#333">
          <h2 style="color:#1a1a1a;margin-bottom:8px">Obrigado pela sua compra! 🌿</h2>
          <p style="color:#555;margin-bottom:24px">
            O seu acesso ao <strong>${productName}</strong> está pronto para download.
          </p>
          <div style="background:#f5f0eb;border-radius:12px;padding:28px;text-align:center;margin-bottom:24px">
            <p style="margin:0 0 20px;color:#555;font-size:14px">
              Clique no botão para transferir o seu PDF:
            </p>
            <a href="${downloadLink}"
               style="background:#4a7c59;color:white;padding:14px 36px;border-radius:8px;
                      text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
              Transferir PDF
            </a>
          </div>
          <p style="color:#888;font-size:13px;margin:8px 0">
            ⏳ Este link expira a <strong>${expiryDate}</strong> (${TOKEN_EXPIRY_DAYS} dias).
          </p>
          <p style="color:#888;font-size:13px;margin:8px 0">
            📥 Pode fazer download até ${MAX_DOWNLOADS_PER_TOKEN} vezes.
          </p>
          <p style="color:#888;font-size:13px;margin:8px 0">
            Guarde o ficheiro localmente após o download.
          </p>
          <hr style="border:none;border-top:1px solid #e8e0d8;margin:28px 0">
          <p style="color:#aaa;font-size:12px;text-align:center">
            EuthyCare — Problemas? Contacte
            <a href="mailto:geral@euthycare.com" style="color:#4a7c59">geral@euthycare.com</a>
          </p>
        </div>
      `,
    }),
  }).catch(err => console.error('[email] failed to send:', err))
}

// Converte capa_url para URL assinada acessível (bucket privado)
// Aceita tanto paths simples como URLs completas do Supabase Storage
async function resolverCapaUrl(capaUrl: string | null): Promise<string | null> {
  if (!capaUrl) return null

  let path = capaUrl
  if (capaUrl.startsWith('http')) {
    // Extrair path de URLs do tipo: .../object/public/bucket/caminho ou .../object/authenticated/bucket/caminho
    const m = capaUrl.match(/\/storage\/v1\/object\/(?:public|authenticated|sign)\/[^/]+\/(.+?)(?:\?.*)?$/)
    if (m) {
      path = decodeURIComponent(m[1])
    } else {
      return capaUrl // URL externa, usar tal como está
    }
  }

  const { data } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365) // 1 ano de TTL
  return data?.signedUrl ?? null
}

// ── GET /loja/produtos ────────────────────────────────────────

router.get('/produtos', async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('produtos')
    .select('id, nome, descricao, preco_cents, capa_url, tipo')
    .eq('ativo', true)
    .order('ordem', { ascending: true })

  if (error) { res.status(500).json({ error: error.message }); return }

  const produtos = await Promise.all(
    (data ?? []).map(async p => ({ ...p, capa_url: await resolverCapaUrl(p.capa_url) }))
  )
  res.json({ produtos })
})

// ── GET /loja/produto/:id ─────────────────────────────────────

router.get('/produto/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  const { data, error } = await supabaseAdmin
    .from('produtos')
    .select('id, nome, descricao, conteudo, preco_cents, capa_url, tipo')
    .eq('id', id).eq('ativo', true).single()

  if (error || !data) { res.status(404).json({ error: 'Produto não encontrado.' }); return }

  const produto = { ...data, capa_url: await resolverCapaUrl(data.capa_url) }
  res.json({ produto })
})

// ── POST /loja/checkout ───────────────────────────────────────

router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const { produto_id } = req.body
    if (!produto_id) { res.status(400).json({ error: 'produto_id obrigatório.' }); return }

    const { data: produto, error: prodErr } = await supabaseAdmin
      .from('produtos').select('*').eq('id', produto_id).eq('ativo', true).single()
    if (prodErr || !produto) { res.status(404).json({ error: 'Produto não encontrado.' }); return }

    // URLs fixas para produção — não depender de env var para evitar erros
    const successUrl = 'https://euthycare.com/loja/sucesso?session_id={CHECKOUT_SESSION_ID}'
    const cancelUrl  = `https://euthycare.com/produto/${produto.id}`

    const unitAmount = Math.round(Number(produto.preco_cents))
    console.log('[loja/checkout] produto_id:', produto.id, '| preco_cents raw:', produto.preco_cents, '| unit_amount:', unitAmount)

    if (unitAmount < 50) {
      res.status(400).json({ error: `Preço inválido: ${unitAmount} cêntimos (mínimo 50). O preço deve ser inserido em cêntimos (ex: 2499 para €24,99).` })
      return
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: String(produto.nome).slice(0, 250),
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      }],
      success_url: successUrl,
      cancel_url:  cancelUrl,
      metadata:    { produto_id: String(produto.id) },
    })

    // Registar pedido pendente — não-bloqueante
    supabaseAdmin.from('pedidos').insert({
      usuario_email:     '',
      produto_id:        produto.id,
      stripe_session_id: session.id,
      status:            'pending',
    }).then(({ error }) => {
      if (error) console.error('[loja/checkout] pedido insert:', error.message)
    })

    res.json({ url: session.url })
  } catch (err) {
    // Log detalhado para diagnóstico no Railway
    const stripeErr = err as Record<string, unknown>
    console.error('[loja/checkout] ERRO DETALHADO:', JSON.stringify({
      message:  stripeErr?.message,
      type:     stripeErr?.type,
      code:     stripeErr?.code,
      status:   stripeErr?.statusCode,
      raw:      stripeErr?.raw,
    }))
    const msg = (stripeErr?.message as string) ?? 'Erro desconhecido'
    res.status(500).json({ error: msg })
  }
})

// ── GET /loja/pedido/:sessionId ───────────────────────────────
// Called from success page. Retrieves Stripe session, marks order paid,
// returns download token. Safe to call multiple times (idempotent).

router.get('/pedido/:sessionId', async (req: Request, res: Response) => {
  const { sessionId } = req.params

  let stripeSession: Stripe.Checkout.Session
  try {
    stripeSession = await stripe.checkout.sessions.retrieve(String(sessionId), {
      expand: ['line_items'],
    })
  } catch {
    res.status(404).json({ error: 'Sessão não encontrada.' })
    return
  }

  if (stripeSession.payment_status !== 'paid') {
    res.status(402).json({ status: 'pending', message: 'Aguardando confirmação do pagamento.' })
    return
  }

  const customerEmail = stripeSession.customer_details?.email ?? stripeSession.customer_email ?? ''

  // Upsert pedido as paid
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: pedido, error: pedErr } = await supabaseAdmin
    .from('pedidos')
    .update({
      status:                 'paid',
      usuario_email:          customerEmail,
      stripe_payment_intent:  stripeSession.payment_intent as string ?? null,
      token_expira_em:        expiresAt,
    })
    .eq('stripe_session_id', sessionId)
    .select('download_token, produto_id, email_enviado')
    .single()

  if (pedErr || !pedido) {
    res.status(500).json({ error: 'Erro ao recuperar pedido.' })
    return
  }

  // Fetch product name for the success page
  const { data: produto } = await supabaseAdmin
    .from('produtos')
    .select('nome')
    .eq('id', pedido.produto_id)
    .single()

  // Send email only once (avoid duplicates on page refresh)
  if (!pedido.email_enviado && customerEmail) {
    await supabaseAdmin.from('pedidos')
      .update({ email_enviado: true })
      .eq('stripe_session_id', sessionId)
    sendDownloadEmail(customerEmail, produto?.nome ?? 'Produto', String(pedido.download_token), expiresAt)
      .catch(err => console.error('[email]', err))
  }

  res.json({
    status:         'paid',
    download_token: pedido.download_token,
    produto_nome:   produto?.nome ?? '',
    email:          customerEmail,
    expira_em:      expiresAt,
  })
})

// ── GET /loja/download/:token ─────────────────────────────────
// Security checklist:
//  1. Token must exist in pedidos
//  2. Order status must be 'paid'
//  3. download_count must be below MAX_DOWNLOADS_PER_TOKEN
//  4. Atomically increment download_count
//  5. Log the attempt (success or failure) with IP + user-agent
//  6. Generate a 60-second signed URL with Content-Disposition: attachment
//  7. Redirect — the signed URL is single-use and expires in 60s

router.get('/download/:token', async (req: Request, res: Response) => {
  const { token } = req.params
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip ?? ''
  const ua = req.headers['user-agent'] ?? ''

  // ── 0. IP rate limit ──────────────────────────────────────────
  // Blocks bulk scraping or token-sharing before any DB hit.
  if (!checkIpRateLimit(ip)) {
    res.status(429).json({
      error: `Demasiados pedidos de download. Tente novamente mais tarde.`,
    })
    return
  }

  // Helper: log a failed attempt (fire-and-forget, never throws)
  async function logFailure(
    pedidoId: string | null,
    produtoId: string | null,
    email: string,
    motivo: string,
  ) {
    await supabaseAdmin.from('downloads_log').insert({
      pedido_id:    pedidoId,
      produto_id:   produtoId,
      usuario_email: email,
      ip_address:   ip,
      user_agent:   ua,
      sucesso:      false,
      motivo_falha: motivo,
    }).then(() => void 0, () => void 0)
  }

  // ── 1. Resolve pedido ─────────────────────────────────────────
  const { data: pedido, error: pedErr } = await supabaseAdmin
    .from('pedidos')
    .select('id, status, produto_id, usuario_email, download_count, token_expira_em')
    .eq('download_token', token)
    .single()

  if (pedErr || !pedido) {
    await logFailure(null, null, '', 'token_invalido')
    res.status(404).json({ error: 'Link de download inválido.' })
    return
  }

  // ── 2. Verify payment ─────────────────────────────────────────
  if (pedido.status !== 'paid') {
    await logFailure(pedido.id, pedido.produto_id, pedido.usuario_email, 'pagamento_nao_confirmado')
    res.status(403).json({ error: 'Pagamento não confirmado.' })
    return
  }

  // ── 2b. Check token expiry ────────────────────────────────────
  if (pedido.token_expira_em && new Date(pedido.token_expira_em) < new Date()) {
    await logFailure(pedido.id, pedido.produto_id, pedido.usuario_email, 'token_expirado')
    res.status(410).json({
      error: `O link de download expirou (válido por ${TOKEN_EXPIRY_DAYS} dias). Contacte o suporte.`,
    })
    return
  }

  // ── 3. Rate limit ─────────────────────────────────────────────
  if (pedido.download_count >= MAX_DOWNLOADS_PER_TOKEN) {
    await logFailure(pedido.id, pedido.produto_id, pedido.usuario_email, 'limite_excedido')
    res.status(429).json({
      error: `Limite de ${MAX_DOWNLOADS_PER_TOKEN} downloads por compra atingido. Contacte o suporte.`,
    })
    return
  }

  // ── 4. Resolve product file path ──────────────────────────────
  const { data: produto, error: prodErr } = await supabaseAdmin
    .from('produtos')
    .select('arquivo_url, nome')
    .eq('id', pedido.produto_id)
    .single()

  if (prodErr || !produto) {
    await logFailure(pedido.id, pedido.produto_id, pedido.usuario_email, 'ficheiro_nao_encontrado')
    res.status(404).json({ error: 'Ficheiro não encontrado.' })
    return
  }

  // ── 5. Generate 60-second signed URL ─────────────────────────
  // `download` option adds Content-Disposition: attachment; filename="..."
  // so browsers download immediately rather than opening in a new tab.
  const filename    = `${produto.nome.replace(/[^a-z0-9]/gi, '_')}.pdf`
  const { data: signedData, error: signErr } = await supabaseAdmin
    .storage
    .from(BUCKET)
    .createSignedUrl(produto.arquivo_url, 60, { download: filename })

  if (signErr || !signedData?.signedUrl) {
    console.error('[/loja/download] signed URL error:', signErr)
    await logFailure(pedido.id, pedido.produto_id, pedido.usuario_email, 'erro_signed_url')
    res.status(500).json({ error: 'Erro ao gerar link de download. Tente novamente.' })
    return
  }

  // ── 6. Atomically increment counter ──────────────────────────
  // Do this AFTER URL generation — if Supabase storage fails, counter stays clean.
  const { error: countErr } = await supabaseAdmin
    .from('pedidos')
    .update({ download_count: pedido.download_count + 1 })
    .eq('id', pedido.id)

  if (countErr) {
    console.error('[/loja/download] counter update error:', countErr)
    // Non-fatal — don't block the download, but log and alert
  }

  // ── 7. Log successful download ────────────────────────────────
  supabaseAdmin.from('downloads_log').insert({
    pedido_id:     pedido.id,
    produto_id:    pedido.produto_id,
    usuario_email: pedido.usuario_email,
    ip_address:    ip,
    user_agent:    ua,
    sucesso:       true,
  }).then(() => void 0, () => void 0) // fire-and-forget

  console.log(
    `[download] token=${token.slice(0, 8)}… product="${produto.nome}" ` +
    `email=${pedido.usuario_email} ip=${ip} count=${pedido.download_count + 1}/${MAX_DOWNLOADS_PER_TOKEN}`,
  )

  // ── 8. Redirect to signed URL ─────────────────────────────────
  // Cache-Control: no-store — browsers must not cache the 302 or the signed URL.
  // The signed URL expires in 60 s; a cached redirect would be invalid immediately after.
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.setHeader('Pragma',        'no-cache')
  res.redirect(302, signedData.signedUrl)
})

// ── POST /loja/webhook/stripe ─────────────────────────────────
// Fallback webhook — keeps orders in sync if success page is never loaded.

router.post('/webhook/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string
  const secret = process.env.STRIPE_LOJA_WEBHOOK_SECRET ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, secret)
  } catch (err) {
    console.error('[loja webhook] signature error', err)
    res.status(400).json({ error: 'Invalid signature.' })
    return
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.payment_status === 'paid') {
      const email = session.customer_details?.email ?? session.customer_email ?? ''
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()

      const { data: updated } = await supabaseAdmin
        .from('pedidos')
        .update({
          status:                'paid',
          usuario_email:         email,
          stripe_payment_intent: session.payment_intent as string ?? null,
          token_expira_em:       expiresAt,
        })
        .eq('stripe_session_id', session.id)
        .eq('status', 'pending') // only update if not already processed
        .select('download_token, produto_id, email_enviado')
        .single()

      // Backup email via webhook (case success page was never reached)
      if (updated && !updated.email_enviado && email) {
        const { data: prod } = await supabaseAdmin
          .from('produtos').select('nome').eq('id', updated.produto_id).single()
        await supabaseAdmin.from('pedidos')
          .update({ email_enviado: true }).eq('stripe_session_id', session.id)
        sendDownloadEmail(email, prod?.nome ?? 'Produto', String(updated.download_token), expiresAt)
          .catch(err => console.error('[webhook email]', err))
      }
    }
  }

  res.json({ received: true })
})

// ── Admin: list ALL products (incl. inactive) ─────────────────

router.get('/admin/produtos', async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: 'Acesso restrito.' }); return }

  const { data, error } = await supabaseAdmin
    .from('produtos')
    .select('*')
    .order('ordem', { ascending: true })

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json({ produtos: data })
})

// ── Admin: create product ─────────────────────────────────────

router.post('/admin/produto', async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: 'Acesso restrito.' }); return }

  const { nome, descricao, conteudo, preco_cents, capa_url, arquivo_url, tipo, ordem } = req.body as Record<string, string | number>

  if (!nome || !preco_cents) {
    res.status(400).json({ error: 'nome e preco_cents são obrigatórios.' })
    return
  }

  const { data, error } = await supabaseAdmin
    .from('produtos')
    .insert({ nome, descricao: descricao ?? '', conteudo: conteudo ?? '', preco_cents, capa_url, arquivo_url, tipo: tipo ?? 'pdf', ordem: ordem ?? 0, ativo: true })
    .select()
    .single()

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json({ produto: data })
})

// ── Admin: update product ─────────────────────────────────────

router.patch('/admin/produto/:id', async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: 'Acesso restrito.' }); return }

  const { id } = req.params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = { ...req.body }
  delete updates.id
  delete updates.criado_em

  const { data, error } = await supabaseAdmin
    .from('produtos')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json({ produto: data })
})

// ── Admin: delete product ─────────────────────────────────────

router.delete('/admin/produto/:id', async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: 'Acesso restrito.' }); return }

  const { id } = req.params
  const { error } = await supabaseAdmin.from('produtos').delete().eq('id', id)
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json({ ok: true })
})

// ── Admin: signed upload URL for PDF / cover image ────────────

router.post('/admin/upload-url', async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: 'Acesso restrito.' }); return }

  const { filename, tipo } = req.body as { filename: string; tipo: 'pdf' | 'capa' }
  if (!filename) { res.status(400).json({ error: 'filename é obrigatório.' }); return }

  const folder = tipo === 'capa' ? 'capas' : 'pdfs'
  const safeName = filename.replace(/[^a-z0-9._-]/gi, '_')
  const path = `${folder}/${Date.now()}-${safeName}`

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUploadUrl(path)

  if (error || !data) { res.status(500).json({ error: 'Erro ao gerar URL de upload.' }); return }
  res.json({ signedUrl: data.signedUrl, path, token: data.token })
})

// ── Admin: list orders ────────────────────────────────────────

router.get('/admin/pedidos', async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'Acesso restrito.' })
    return
  }

  const limit  = Math.min(parseInt(req.query.limit  as string ?? '50', 10), 500)
  const offset = parseInt(req.query.offset as string ?? '0', 10)

  const { data, error, count } = await supabaseAdmin
    .from('pedidos')
    .select('id, usuario_email, status, download_count, criado_em, produtos(nome)', { count: 'exact' })
    .order('criado_em', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json({ total: count, offset, limit, pedidos: data })
})

// ── Admin: download log ───────────────────────────────────────

router.get('/admin/downloads', async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'Acesso restrito.' })
    return
  }

  const limit  = Math.min(parseInt(req.query.limit  as string ?? '100', 10), 1000)
  const offset = parseInt(req.query.offset as string ?? '0', 10)

  const { data, error, count } = await supabaseAdmin
    .from('downloads_log')
    .select('*, produtos(nome)', { count: 'exact' })
    .order('criado_em', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json({ total: count, offset, limit, downloads: data })
})

// ── Admin: gerar pedido de teste (sem pagamento) ──────────────
router.post('/admin/pedido-teste', async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: 'Acesso restrito.' }); return }

  const { produto_id, email } = req.body
  if (!produto_id || !email) {
    res.status(400).json({ error: 'produto_id e email são obrigatórios' }); return
  }

  const { data: produto } = await supabaseAdmin.from('produtos').select('id, nome').eq('id', produto_id).single()
  if (!produto) { res.status(404).json({ error: 'Produto não encontrado' }); return }

  const token = crypto.randomUUID()
  const expira = new Date()
  expira.setDate(expira.getDate() + 7)

  const { data: pedido, error } = await supabaseAdmin.from('pedidos').insert({
    usuario_email:         email,
    produto_id,
    status:                'paid',
    stripe_session_id:     `teste_admin_${Date.now()}`,
    stripe_payment_intent: null,
    download_token:        token,
    token_expira_em:       expira.toISOString(),
    email_enviado:         false,
    download_count:        0,
  }).select().single()

  if (error) { res.status(500).json({ error: error.message }); return }

  const siteUrl = process.env.FRONTEND_URL ?? 'https://euthycare.com'
  res.json({
    ok: true,
    pedido_id: pedido.id,
    download_url: `${siteUrl}/loja/download/${token}`,
    expira_em: expira.toISOString(),
  })
})

export default router
