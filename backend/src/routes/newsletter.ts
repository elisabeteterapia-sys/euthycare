// Routes: /newsletter
// POST /newsletter — subscrever (público)
// GET  /newsletter/admin — listar subscritores (admin)

import { Router, Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase'

const router = Router()

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    res.status(403).json({ error: 'Acesso restrito.' }); return
  }
  next()
}

// POST /newsletter — subscrever
router.post('/', async (req: Request, res: Response) => {
  const { email, nome, origem } = req.body

  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Email inválido.' }); return
  }

  const { error } = await supabaseAdmin
    .from('newsletter_subscribers')
    .upsert({ email: email.toLowerCase().trim(), nome: nome ?? null, origem: origem ?? 'site' }, { onConflict: 'email', ignoreDuplicates: true })

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json({ success: true })
})

// GET /newsletter/admin — listar
router.get('/admin', requireAdmin, async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('newsletter_subscribers')
    .select('id, email, nome, origem, confirmado, criado_em')
    .order('criado_em', { ascending: false })

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

export default router
