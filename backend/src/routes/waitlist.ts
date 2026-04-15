// ─── Routes: /waitlist ────────────────────────────────────────
// POST /waitlist          — submit name + email (public)
// GET  /waitlist/admin    — list all leads (admin only)
// GET  /waitlist/admin/count — total count

import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { restInsert } from '../lib/supabaseRest'

const router = Router()

function isAdmin(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  return req.headers['x-admin-secret'] === secret
}

// POST /waitlist
router.post('/', async (req: Request, res: Response) => {
  const { nome, email, source = 'landing', tipo_usuario = 'terapeuta' } = req.body

  if (!nome || typeof nome !== 'string' || nome.trim().length < 2) {
    res.status(400).json({ error: 'Nome inválido.' })
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    res.status(400).json({ error: 'E-mail inválido.' })
    return
  }

  const metadata: Record<string, string> = {}
  const ua = req.headers['user-agent']
  const ref = req.headers['referer']
  if (ua)  metadata.user_agent = ua
  if (ref) metadata.referrer   = ref

  const tipoValido = ['terapeuta', 'clinica'].includes(tipo_usuario) ? tipo_usuario : 'terapeuta'

  const { data, error } = await restInsert('waitlist', {
    nome:        nome.trim(),
    email:       email.trim().toLowerCase(),
    tipo_usuario: tipoValido,
    source:      source.slice(0, 64),
    metadata,
  })

  if (error) {
    // Duplicate email (unique constraint)
    const msg = typeof error === 'object' && (error as Record<string,unknown>).message as string
    if (msg?.includes('duplicate') || msg?.includes('unique') || (error as Record<string,unknown>).code === '23505') {
      res.json({ success: true, message: 'Já está na lista!' })
      return
    }
    console.error('[/waitlist]', error)
    res.status(500).json({ error: msg ?? 'Erro ao guardar. Tente novamente.' })
    return
  }

  res.json({ success: true, message: 'Adicionado à lista de espera!' })
})

// GET /waitlist/admin — list leads
router.get('/admin', async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'Acesso restrito.' })
    return
  }

  const limit  = Math.min(parseInt(req.query.limit  as string ?? '100', 10), 1000)
  const offset = parseInt(req.query.offset as string ?? '0', 10)

  const { data, error, count } = await supabaseAdmin
    .from('waitlist')
    .select('*', { count: 'exact' })
    .order('criado_em', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json({ total: count, offset, limit, leads: data })
})

// GET /waitlist/admin/count
router.get('/admin/count', async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'Acesso restrito.' })
    return
  }

  const { count, error } = await supabaseAdmin
    .from('waitlist')
    .select('*', { count: 'exact', head: true })

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json({ count })
})

export default router
