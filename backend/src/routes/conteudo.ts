import { Router, Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase'

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const secret = req.headers['x-admin-secret']
  if (secret !== process.env.ADMIN_SECRET) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  next()
}

const router = Router()

// GET /conteudo — todos os conteúdos (público)
router.get('/', async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('site_conteudo')
    .select('chave, valor')

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  // Converter array em objecto { chave: valor }
  const conteudo = Object.fromEntries(data.map(r => [r.chave, r.valor]))
  res.json(conteudo)
})

// PATCH /conteudo/:chave — actualizar um conteúdo (admin)
router.patch('/:chave', requireAdmin, async (req: Request, res: Response) => {
  const { chave } = req.params
  const { valor } = req.body as { valor: string }

  if (typeof valor !== 'string') {
    res.status(400).json({ error: 'valor é obrigatório' })
    return
  }

  const { error } = await supabaseAdmin
    .from('site_conteudo')
    .upsert({ chave, valor, updated_at: new Date().toISOString() }, { onConflict: 'chave' })

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json({ chave, valor })
})

// GET /conteudo/admin/all — todos com descrição (admin)
router.get('/admin/all', requireAdmin, async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('site_conteudo')
    .select('*')
    .order('chave')

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

export default router
