import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { supabaseAdmin } from '../lib/supabase'

const router = Router()

// GET /users/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', req.user!.id)
    .single()

  if (error) {
    res.status(404).json({ error: 'Profile not found' })
    return
  }

  res.json(data)
})

// PATCH /users/me
router.patch('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, avatar_url } = req.body

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ name, avatar_url, updated_at: new Date().toISOString() })
    .eq('id', req.user!.id)
    .select()
    .single()

  if (error) {
    res.status(400).json({ error: error.message })
    return
  }

  res.json(data)
})

// GET /users/admin — listar todos os utilizadores (admin only)
import { Request } from 'express'
router.get('/admin', async (req: Request, res: Response) => {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    res.status(403).json({ error: 'Acesso restrito.' }); return
  }

  const limit  = Math.min(parseInt(req.query.limit  as string ?? '100', 10), 500)
  const offset = parseInt(req.query.offset as string ?? '0', 10)

  const { data, error, count } = await supabaseAdmin
    .from('profiles')
    .select('id, email, name, avatar_url, created_at, stripe_subscription_status', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json({ total: count, offset, limit, utilizadores: data })
})

export default router
