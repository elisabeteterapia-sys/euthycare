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

export default router
