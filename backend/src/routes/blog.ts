// ─── Routes: /blog ────────────────────────────────────────────
// GET  /blog              — listar posts publicados (público)
// GET  /blog/:slug        — post por slug (público)
// GET  /blog/admin        — listar todos os posts (admin)
// POST /blog/admin        — criar post (admin)
// PATCH /blog/admin/:id   — actualizar post (admin)
// DELETE /blog/admin/:id  — eliminar post (admin)

import { Router, Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase'

const router = Router()

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    res.status(403).json({ error: 'Acesso restrito.' }); return
  }
  next()
}

function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-')
    .slice(0, 80)
}

// GET /blog — posts publicados
router.get('/', async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .select('id, titulo, slug, categoria, autor, resumo, tempo_leitura, imagem_url, criado_em')
    .eq('publicado', true)
    .order('criado_em', { ascending: false })

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

// GET /blog/admin — todos os posts
router.get('/admin', requireAdmin, async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .select('*')
    .order('criado_em', { ascending: false })

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

// GET /blog/:slug — post público por slug
router.get('/:slug', async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .select('*')
    .eq('slug', req.params.slug)
    .eq('publicado', true)
    .single()

  if (error || !data) { res.status(404).json({ error: 'Post não encontrado.' }); return }
  res.json(data)
})

// POST /blog/admin — criar post
router.post('/admin', requireAdmin, async (req: Request, res: Response) => {
  const { titulo, categoria, autor, resumo, conteudo, tempo_leitura, imagem_url, publicado } = req.body

  if (!titulo?.trim()) { res.status(400).json({ error: 'Título obrigatório.' }); return }

  const slug = slugify(titulo)

  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .insert({
      titulo:        titulo.trim(),
      slug,
      categoria:     categoria ?? 'Geral',
      autor:         autor ?? '',
      resumo:        resumo ?? '',
      conteudo:      conteudo ?? '',
      tempo_leitura: tempo_leitura ?? '5 min',
      imagem_url:    imagem_url ?? null,
      publicado:     publicado ?? false,
    })
    .select()
    .single()

  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(201).json(data)
})

// PATCH /blog/admin/:id — actualizar post
router.patch('/admin/:id', requireAdmin, async (req: Request, res: Response) => {
  const { titulo, categoria, autor, resumo, conteudo, tempo_leitura, imagem_url, publicado } = req.body
  const updates: Record<string, unknown> = { atualizado_em: new Date().toISOString() }

  if (titulo    !== undefined) { updates.titulo = titulo.trim(); updates.slug = slugify(titulo) }
  if (categoria !== undefined) updates.categoria     = categoria
  if (autor     !== undefined) updates.autor         = autor
  if (resumo    !== undefined) updates.resumo        = resumo
  if (conteudo  !== undefined) updates.conteudo      = conteudo
  if (tempo_leitura !== undefined) updates.tempo_leitura = tempo_leitura
  if (imagem_url    !== undefined) updates.imagem_url    = imagem_url
  if (publicado !== undefined) updates.publicado     = publicado

  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

// DELETE /blog/admin/:id
router.delete('/admin/:id', requireAdmin, async (req: Request, res: Response) => {
  const { error } = await supabaseAdmin
    .from('blog_posts')
    .delete()
    .eq('id', req.params.id)

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json({ success: true })
})

export default router
