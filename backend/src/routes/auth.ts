import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase'

const router = Router()

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
})

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

// POST /auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  const parsed = signUpSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const { email, password, name } = parsed.data
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { name },
    email_confirm: true,
  })

  if (error) {
    res.status(400).json({ error: error.message })
    return
  }

  res.status(201).json({ user: { id: data.user.id, email: data.user.email } })
})

// POST /auth/signin
router.post('/signin', async (req: Request, res: Response) => {
  const parsed = signInSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const { email, password } = parsed.data
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    res.status(401).json({ error: error.message })
    return
  }

  res.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: { id: data.user.id, email: data.user.email },
  })
})

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  const { refresh_token } = req.body
  if (!refresh_token) {
    res.status(400).json({ error: 'refresh_token required' })
    return
  }

  const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token })
  if (error) {
    res.status(401).json({ error: error.message })
    return
  }

  res.json({
    access_token: data.session!.access_token,
    refresh_token: data.session!.refresh_token,
  })
})

// POST /auth/signout
router.post('/signout', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.slice(7)
  if (token) {
    await supabaseAdmin.auth.admin.signOut(token)
  }
  res.json({ message: 'Signed out' })
})

export default router
