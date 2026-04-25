// ─── Routes: /terapeutas ──────────────────────────────────────
import { Router, Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import { supabaseAdmin } from '../lib/supabase'
import { restInsert, restUpdate, restDelete } from '../lib/supabaseRest'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

const JWT_SECRET = process.env.TERAPEUTA_JWT_SECRET ?? 'euthycare-terapeuta-secret-change-me'

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const secret = req.headers['x-admin-secret']
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: 'Acesso negado' }); return
  }
  next()
}

declare module 'express-serve-static-core' {
  interface Request { terapeutaId?: string }
}

function requireTerapeuta(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers['authorization']
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token não fornecido' }); return
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { sub: string }
    req.terapeutaId = payload.sub
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}

function gerarSlots(horaInicio: string, horaFim: string, intervaloMin = 60): string[] {
  const slots: string[] = []
  const [hi, mi] = horaInicio.split(':').map(Number)
  const [hf, mf] = horaFim.split(':').map(Number)
  const inicioMin = hi * 60 + mi
  const fimMin = hf * 60 + mf
  for (let m = inicioMin; m < fimMin; m += intervaloMin) {
    slots.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`)
  }
  return slots
}

function toIcsDt(data: string, hora: string) {
  return data.replace(/-/g, '') + 'T' + hora.slice(0, 5).replace(':', '') + '00'
}

function addMinutes(hora: string, min: number) {
  const [h, m] = hora.split(':').map(Number)
  const total = h * 60 + m + min
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function buildIcal(events: Array<{
  uid: string; data: string; hora: string; duracaoMin: number
  nomeCliente: string; videoUrl?: string; status: string
}>, terapeutaNome: string) {
  const now = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15)
  const lines: string[] = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//EuthyCare//PT',
    'CALSCALE:GREGORIAN', 'X-WR-CALNAME:EuthyCare — ' + terapeutaNome,
    'X-WR-TIMEZONE:Europe/Lisbon', 'METHOD:PUBLISH',
  ]
  for (const e of events) {
    const inicio = toIcsDt(e.data, e.hora)
    const fim    = toIcsDt(e.data, addMinutes(e.hora, e.duracaoMin))
    const desc   = e.videoUrl
      ? `Videochamada: ${e.videoUrl}\\nCliente: ${e.nomeCliente}`
      : `Cliente: ${e.nomeCliente}`
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}@euthycare.com`, `DTSTAMP:${now}`,
      `DTSTART;TZID=Europe/Lisbon:${inicio}`, `DTEND;TZID=Europe/Lisbon:${fim}`,
      `SUMMARY:Consulta — ${e.nomeCliente}`, `DESCRIPTION:${desc}`,
      'LOCATION:Online (Videochamada)',
      ...(e.videoUrl ? [`URL:${e.videoUrl}`] : []),
      `STATUS:${e.status === 'confirmado' ? 'CONFIRMED' : 'TENTATIVE'}`,
      'BEGIN:VALARM', 'TRIGGER:-PT15M', 'ACTION:DISPLAY',
      'DESCRIPTION:Consulta em 15 minutos', 'END:VALARM', 'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

const router = Router()

// ── GET /terapeutas/cal/:token ────────────────────────────────
router.get('/cal/:token', async (req: Request, res: Response) => {
  const { token } = req.params
  const { data, error } = await supabaseAdmin.from('terapeutas')
    .select('id, nome, duracao_min').eq('calendario_token', token).single()
  if (error || !data) { res.status(404).send('Calendário não encontrado'); return }
  const terapeuta = data

  const hoje = new Date().toISOString().slice(0, 10)
  const limite = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const { data: agendamentos } = await supabaseAdmin
    .from('agendamentos').select('id, data, hora, status, nome_cliente, video_url')
    .eq('terapeuta_id', terapeuta.id).not('status', 'eq', 'cancelado')
    .gte('data', hoje).lte('data', limite).order('data').order('hora')

  const events = (agendamentos ?? []).map((a: Record<string, unknown>) => ({
    uid: a.id as string, data: a.data as string, hora: a.hora as string,
    duracaoMin: terapeuta.duracao_min ?? 50,
    nomeCliente: a.nome_cliente as string,
    videoUrl: (a.video_url as string | null) ?? undefined,
    status: a.status as string,
  }))
  const ical = buildIcal(events, terapeuta.nome)
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
  res.setHeader('Content-Disposition', 'inline; filename="euthycare.ics"')
  res.setHeader('Cache-Control', 'no-cache, no-store')
  res.send(ical)
})

// ── POST /terapeutas/me/renovar-calendario ────────────────────
router.post('/me/renovar-calendario', requireTerapeuta, async (req: Request, res: Response) => {
  const newToken = crypto.randomUUID()
  const { error } = await supabaseAdmin.from('terapeutas')
    .update({ calendario_token: newToken }).eq('id', req.terapeutaId!)
  if (error) { res.status(500).json({ error: 'Erro ao renovar token' }); return }
  res.json({ calendario_token: newToken })
})

// ── POST /terapeutas/login ────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  const { email, senha } = req.body
  if (!email || !senha) { res.status(400).json({ error: 'email e senha obrigatórios' }); return }
  const { data, error } = await supabaseAdmin.from('terapeutas')
    .select('id, nome, email, slug, senha_hash, ativo').eq('email', email.toLowerCase().trim()).single()
  if (error || !data) { res.status(401).json({ error: 'Credenciais inválidas' }); return }
  const t = data
  if (!t.ativo) { res.status(403).json({ error: 'Conta inativa. Contacte a administração.' }); return }
  if (!t.senha_hash) { res.status(401).json({ error: 'Senha não definida. Contacte a administração.' }); return }
  const ok = await bcrypt.compare(senha, t.senha_hash)
  if (!ok) { res.status(401).json({ error: 'Credenciais inválidas' }); return }
  const token = jwt.sign({ sub: t.id, nome: t.nome }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, terapeuta: { id: t.id, nome: t.nome, email: t.email, slug: t.slug } })
})

// ── POST /terapeutas/me/upload-foto ──────────────────────────
router.post('/me/upload-foto', requireTerapeuta, upload.single('foto'), async (req: Request, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'Nenhum ficheiro enviado' }); return }
  const result = await uploadParaStorage(req.file, `terapeutas/${req.terapeutaId}`)
  if ('error' in result) { res.status(400).json({ error: result.error }); return }
  const { error: updateErr } = await restUpdate('terapeutas', req.terapeutaId!, { foto_url: result.url })
  if (updateErr) { res.status(500).json({ error: 'Foto enviada mas não guardada. Verifique as configurações do servidor.' }); return }
  res.status(201).json({ url: result.url })
})

// ── PATCH /terapeutas/me ─────────────────────────────────────
router.patch('/me', requireTerapeuta, async (req: Request, res: Response) => {
  const b = req.body
  const allowed = ['nome', 'titulo', 'bio', 'foto_url', 'especialidades', 'timezone']
  const update: Record<string, unknown> = {}
  for (const k of allowed) { if (k in b) update[k] = b[k] }
  if (Object.keys(update).length === 0) { res.status(400).json({ error: 'Nenhum campo para actualizar' }); return }
  const { data, error } = await supabaseAdmin.from('terapeutas')
    .update(update).eq('id', req.terapeutaId!).select('id, nome, titulo, bio, foto_url, especialidades, email, timezone').single()
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json({ terapeuta: data })
})

// ── GET /terapeutas/me ────────────────────────────────────────
router.get('/me', requireTerapeuta, async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin.from('terapeutas')
    .select('id, nome, titulo, bio, foto_url, especialidades, preco_cents, duracao_min, comissao_percentagem, email, calendario_token, timezone')
    .eq('id', req.terapeutaId!).single()
  if (error || !data) { res.status(404).json({ error: 'Terapeuta não encontrada' }); return }
  res.json({ terapeuta: data })
})

// ── GET /terapeutas/me/agenda ─────────────────────────────────
router.get('/me/agenda', requireTerapeuta, async (req: Request, res: Response) => {
  const { data: dataParam } = req.query
  const id = req.terapeutaId!
  if (!dataParam || typeof dataParam !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dataParam)) {
    res.status(400).json({ error: 'Parâmetro "data" obrigatório no formato YYYY-MM-DD' }); return
  }
  const [agendamentos, bloqueios] = await Promise.all([
    supabaseAdmin.from('agendamentos')
      .select('id, hora, status, nome_cliente, email_cliente, notas, video_url')
      .eq('terapeuta_id', id).eq('data', dataParam).order('hora'),
    supabaseAdmin.from('bloqueios_agenda')
      .select('hora_inicio, hora_fim').eq('terapeuta_id', id).eq('data', dataParam),
  ])
  res.json({ data: dataParam, agendamentos: agendamentos.data ?? [], bloqueios: bloqueios.data ?? [] })
})

// ── GET /terapeutas/me/repasses ───────────────────────────────
router.get('/me/repasses', requireTerapeuta, async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('creditos_cliente')
    .select('id, cliente_email, cliente_nome, valor_pago_cents, comissao_cents, repasse_cents, repasse_pago, criado_em, pacotes(nome, numero_sessoes)')
    .eq('terapeuta_id', req.terapeutaId!)
    .order('criado_em', { ascending: false })
  if (error) { res.status(500).json({ error: error.message }); return }
  const total_recebido = (data ?? []).reduce((s, c) => s + (c.valor_pago_cents ?? 0), 0)
  const total_repasse  = (data ?? []).reduce((s, c) => s + (c.repasse_cents ?? 0), 0)
  const por_pagar      = (data ?? []).filter(c => !c.repasse_pago).reduce((s, c) => s + (c.repasse_cents ?? 0), 0)
  res.json({ pagamentos: data ?? [], total_recebido, total_repasse, por_pagar })
})

// ── Disponibilidade (self) ─────────────────────────────────────
router.get('/me/disponibilidade', requireTerapeuta, async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin.from('disponibilidades')
    .select('*').eq('terapeuta_id', req.terapeutaId!).order('dia_semana')
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data ?? [])
})

router.put('/me/disponibilidade', requireTerapeuta, async (req: Request, res: Response) => {
  const id = req.terapeutaId!
  const rows = (req.body as Array<Record<string, unknown>>).map(r => ({ ...r, terapeuta_id: id }))
  await supabaseAdmin.from('disponibilidades').delete().eq('terapeuta_id', id)
  if (rows.length > 0) {
    const { error } = await supabaseAdmin.from('disponibilidades').insert(rows)
    if (error) { res.status(500).json({ error: error.message }); return }
  }
  res.json({ ok: true })
})

// ── Bloqueios de agenda (self) ────────────────────────────────
router.get('/me/bloqueios', requireTerapeuta, async (req: Request, res: Response) => {
  const { from, to } = req.query
  let q = supabaseAdmin.from('bloqueios_agenda').select('*').eq('terapeuta_id', req.terapeutaId!).order('data')
  if (from && typeof from === 'string') q = q.gte('data', from)
  if (to   && typeof to   === 'string') q = q.lte('data', to)
  const { data, error } = await q
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data ?? [])
})

router.post('/me/bloqueio', requireTerapeuta, async (req: Request, res: Response) => {
  const { data: dt, hora_inicio, hora_fim, motivo } = req.body
  if (!dt) { res.status(400).json({ error: 'data obrigatória' }); return }
  const { data, error } = await supabaseAdmin.from('bloqueios_agenda').insert({
    terapeuta_id: req.terapeutaId!,
    data: dt,
    hora_inicio: hora_inicio ?? null,
    hora_fim:    hora_fim    ?? null,
    motivo:      motivo      ?? null,
  }).select().single()
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

router.delete('/me/bloqueio/:id', requireTerapeuta, async (req: Request, res: Response) => {
  const { error } = await supabaseAdmin.from('bloqueios_agenda')
    .delete().eq('id', req.params.id).eq('terapeuta_id', req.terapeutaId!)
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json({ ok: true })
})

// ── GET /terapeutas/slug/:slug — perfil público por slug ──────
router.get('/slug/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params
  const { data, error } = await supabaseAdmin.from('terapeutas')
    .select('id, nome, titulo, bio, foto_url, especialidades, preco_cents, duracao_min, comissao_percentagem, timezone')
    .eq('slug', slug).eq('ativo', true).single()
  if (error || !data) { res.status(404).json({ error: 'Terapeuta não encontrada.' }); return }

  const selectPacotes = 'id, tipo, nome, numero_sessoes, duracao_min, preco, moeda, validade_dias, destaque, descricao'

  // Pacotes específicos desta terapeuta
  const { data: pacotesProprios } = await supabaseAdmin.from('pacotes')
    .select(selectPacotes)
    .eq('terapeuta_id', data.id).eq('ativo', true).eq('publico', true).order('preco')

  // Pacote experimental global (terapeuta_id nulo) — sempre incluído
  const { data: expGlobal } = await supabaseAdmin.from('pacotes')
    .select(selectPacotes)
    .is('terapeuta_id', null).eq('tipo', 'experimental').eq('ativo', true).eq('publico', true)

  // Merge: experimental global primeiro, depois os próprios (sem duplicar tipo experimental)
  const temExpProprio = (pacotesProprios ?? []).some(p => p.tipo === 'experimental')
  const expBase = (!temExpProprio && expGlobal?.length) ? expGlobal : []
  const pacotes = [...expBase, ...(pacotesProprios ?? [])].sort((a, b) => Number(a.preco) - Number(b.preco))

  res.json({ terapeuta: data, pacotes })
})

// ── GET /terapeutas ───────────────────────────────────────────
router.get('/', async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin.from('terapeutas')
    .select('id, nome, titulo, bio, foto_url, especialidades, preco_cents, duracao_min, comissao_percentagem, ativo, email, slug')
    .eq('ativo', true).order('nome')
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json({ terapeutas: data ?? [] })
})

// ── GET /terapeutas/:id ───────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin.from('terapeutas')
    .select('id, nome, titulo, bio, foto_url, especialidades, preco_cents, duracao_min')
    .eq('id', req.params.id).eq('ativo', true).single()
  if (error || !data) { res.status(404).json({ error: 'Terapeuta não encontrada.' }); return }
  res.json({ terapeuta: data })
})

// ── GET /terapeutas/:id/slots ─────────────────────────────────
router.get('/:id/slots', async (req: Request, res: Response) => {
  const { id } = req.params
  const { data: dataParam } = req.query
  if (!dataParam || typeof dataParam !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dataParam)) {
    res.status(400).json({ error: 'Parâmetro "data" obrigatório no formato YYYY-MM-DD' }); return
  }
  const diaSemana = new Date(dataParam + 'T00:00:00').getDay()
  const { data: bloqueios } = await supabaseAdmin.from('bloqueios_agenda')
    .select('hora_inicio, hora_fim').eq('terapeuta_id', id).eq('data', dataParam)
  if (bloqueios?.some(b => !b.hora_inicio)) { res.json({ data: dataParam, slots: [] }); return }
  let { data: disps } = await supabaseAdmin.from('disponibilidades')
    .select('hora_inicio, hora_fim, intervalo_min')
    .eq('terapeuta_id', id).eq('dia_semana', diaSemana).eq('ativo', true)
  // Fallback: disponibilidades globais (sem terapeuta_id) configuradas via admin
  if (!disps || disps.length === 0) {
    const { data: fallback } = await supabaseAdmin.from('disponibilidades')
      .select('hora_inicio, hora_fim, intervalo_min')
      .is('terapeuta_id', null).eq('dia_semana', diaSemana).eq('ativo', true)
    disps = fallback
  }
  if (!disps || disps.length === 0) { res.json({ data: dataParam, slots: [] }); return }
  const todosSlots: string[] = []
  for (const d of disps) todosSlots.push(...gerarSlots(d.hora_inicio, d.hora_fim, d.intervalo_min ?? 60))
  const { data: agendados } = await supabaseAdmin.from('agendamentos')
    .select('hora').eq('terapeuta_id', id).eq('data', dataParam).not('status', 'eq', 'cancelado')
  const ocupados = new Set((agendados ?? []).map(a => a.hora.slice(0, 5)))
  const bloqueadosSlots = new Set<string>()
  for (const b of bloqueios ?? []) {
    if (b.hora_inicio && b.hora_fim) gerarSlots(b.hora_inicio, b.hora_fim).forEach(s => bloqueadosSlots.add(s))
  }
  res.json({ data: dataParam, slots: [...new Set(todosSlots)].sort().filter(s => !ocupados.has(s) && !bloqueadosSlots.has(s)) })
})

// ── Função auxiliar: upload para storage ─────────────────────
async function uploadParaStorage(file: Express.Multer.File, prefixo: string): Promise<{ url: string } | { error: string }> {
  const allowed = ['image/png', 'image/jpeg', 'image/webp']
  if (!allowed.includes(file.mimetype)) return { error: 'Formato inválido. Use PNG, JPG ou WebP.' }
  const ext  = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg'
  const path = `${prefixo}/${Date.now()}.${ext}`
  const { error } = await supabaseAdmin.storage.from('uploads').upload(path, file.buffer, {
    contentType: file.mimetype, upsert: true,
  })
  if (error) return { error: error.message }
  const { data } = supabaseAdmin.storage.from('uploads').getPublicUrl(path)
  return { url: data.publicUrl }
}

// ── Admin: upload de foto ─────────────────────────────────────
router.post('/admin/upload-foto', requireAdmin, upload.single('foto'), async (req: Request, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'Nenhum ficheiro enviado' }); return }
  const result = await uploadParaStorage(req.file, 'terapeutas')
  if ('error' in result) { res.status(400).json({ error: result.error }); return }
  res.status(201).json({ url: result.url })
})

// ── Admin: criar terapeuta ────────────────────────────────────
router.post('/admin', requireAdmin, async (req: Request, res: Response) => {
  const { nome, titulo, bio, foto_url, especialidades, preco_cents, duracao_min, comissao_percentagem, email, senha } = req.body
  if (!nome) { res.status(400).json({ error: 'nome é obrigatório.' }); return }
  const emailVal = email ? email.toLowerCase().trim() : null
  const senhaHash = senha ? await bcrypt.hash(senha, 10) : null
  const { nome: n, ...rest } = req.body
  const slugVal = rest.slug ? String(rest.slug).toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : null
  const { data, error } = await restInsert('terapeutas', {
    nome, titulo: titulo ?? '', bio: bio ?? '', foto_url: foto_url ?? null,
    especialidades: especialidades ?? '', preco_cents: preco_cents ?? 2500,
    duracao_min: duracao_min ?? 50, comissao_percentagem: comissao_percentagem ?? 20,
    ativo: true, email: emailVal, senha_hash: senhaHash,
    slug: slugVal,
  })
  if (error) { res.status(500).json({ error: (error as Record<string,unknown>).message ?? JSON.stringify(error) }); return }
  res.status(201).json({ terapeuta: data })
})

// ── Admin: editar terapeuta ───────────────────────────────────
router.patch('/admin/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params
  const b = req.body
  const allowed = ['nome','titulo','bio','foto_url','especialidades','preco_cents','duracao_min','comissao_percentagem','ativo','email','slug']
  const update: Record<string, unknown> = {}
  for (const k of allowed) { if (k in b) update[k] = b[k] }
  if (b.senha) update['senha_hash'] = await bcrypt.hash(b.senha, 10)
  if (Object.keys(update).length === 0) { res.status(400).json({ error: 'Nenhum campo para actualizar' }); return }
  const { data, error } = await restUpdate('terapeutas', String(id), update)
  if (error) { res.status(500).json({ error: (error as Record<string,unknown>).message ?? JSON.stringify(error) }); return }
  res.json({ terapeuta: data })
})

// ── Admin: eliminar terapeuta ─────────────────────────────────
router.delete('/admin/:id', requireAdmin, async (req: Request, res: Response) => {
  const { error } = await restDelete('terapeutas', String(req.params.id))
  if (error) { res.status(500).json({ error: (error as Record<string,unknown>).message ?? JSON.stringify(error) }); return }
  res.json({ ok: true })
})

// ── Admin: disponibilidade ────────────────────────────────────
router.get('/admin/:id/disponibilidade', requireAdmin, async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin.from('disponibilidades')
    .select('*').eq('terapeuta_id', req.params.id).order('dia_semana')
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

router.put('/admin/:id/disponibilidade', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params
  const rows = (req.body as Array<Record<string, unknown>>).map(r => ({ ...r, terapeuta_id: id }))
  await supabaseAdmin.from('disponibilidades').delete().eq('terapeuta_id', id)
  if (rows.length > 0) {
    const { error } = await supabaseAdmin.from('disponibilidades').insert(rows)
    if (error) { res.status(500).json({ error: error.message }); return }
  }
  res.json({ ok: true })
})

// ── Admin: resumo de repasses (por terapeuta) ─────────────────
router.get('/admin/repasses/resumo', requireAdmin, async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('creditos_cliente')
    .select('terapeuta_id, valor_pago_cents, repasse_cents, comissao_cents, repasse_pago, terapeutas(nome)')
    .not('terapeuta_id', 'is', null)
  if (error) { res.status(500).json({ error: error.message }); return }

  const map = new Map<string, {
    nome: string; total_recebido: number; total_repasse: number
    total_comissao: number; por_pagar: number; num_pagamentos: number
  }>()
  for (const c of data ?? []) {
    const tid  = c.terapeuta_id as string
    const nome = (c.terapeutas as unknown as { nome: string } | null)?.nome ?? 'Desconhecida'
    const entry = map.get(tid) ?? { nome, total_recebido: 0, total_repasse: 0, total_comissao: 0, por_pagar: 0, num_pagamentos: 0 }
    entry.total_recebido  += c.valor_pago_cents ?? 0
    entry.total_repasse   += c.repasse_cents    ?? 0
    entry.total_comissao  += c.comissao_cents   ?? 0
    entry.num_pagamentos  += 1
    if (!c.repasse_pago) entry.por_pagar += c.repasse_cents ?? 0
    map.set(tid, entry)
  }
  res.json({ repasses: Object.fromEntries(map) })
})

// ── Admin: listar pagamentos de uma terapeuta ─────────────────
router.get('/admin/:id/repasses', requireAdmin, async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('creditos_cliente')
    .select('id, cliente_email, cliente_nome, valor_pago_cents, comissao_cents, repasse_cents, repasse_pago, criado_em, pacotes(nome)')
    .eq('terapeuta_id', req.params.id)
    .order('criado_em', { ascending: false })
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json({ pagamentos: data ?? [] })
})

// ── Admin: definir/alterar senha ──────────────────────────────
router.patch('/admin/:id/senha', requireAdmin, async (req: Request, res: Response) => {
  const { senha } = req.body
  if (!senha || senha.length < 6) { res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' }); return }
  const hash = await bcrypt.hash(senha, 10)
  const { error } = await restUpdate('terapeutas', String(req.params.id), { senha_hash: hash })
  if (error) { res.status(500).json({ error: (error as Record<string,unknown>).message ?? JSON.stringify(error) }); return }
  res.json({ ok: true })
})

// ── Admin: marcar repasses como pagos ─────────────────────────
router.post('/admin/:id/marcar-repasse', requireAdmin, async (req: Request, res: Response) => {
  const { error } = await supabaseAdmin.from('agendamentos')
    .update({ repasse_pago: true })
    .eq('terapeuta_id', req.params.id).eq('repasse_pago', false).eq('status', 'confirmado')
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json({ ok: true })
})

export default router
