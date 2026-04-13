// ─── Routes: /terapeutas ──────────────────────────────────────
// GET  /terapeutas              — lista terapeutas activas (público)
// GET  /terapeutas/:id          — perfil da terapeuta (público)
// GET  /terapeutas/:id/slots    — slots disponíveis ?data=YYYY-MM-DD (público)
// GET  /terapeutas/cal/:token   — feed iCal da terapeuta (token secreto, sem auth)
// POST /terapeutas/login        — login da terapeuta (retorna JWT)
// GET  /terapeutas/me           — perfil próprio (JWT)
// GET  /terapeutas/me/agenda    — agenda própria ?data=YYYY-MM-DD (JWT)
// GET  /terapeutas/me/repasses  — repasses/comissões próprios (JWT)
// POST /terapeutas/me/renovar-calendario — novo token de calendário (JWT)
// POST /terapeutas/admin        — criar terapeuta (admin)
// PATCH /terapeutas/admin/:id   — editar terapeuta (admin)
// DELETE /terapeutas/admin/:id  — eliminar terapeuta (admin)
// GET  /terapeutas/admin/repasses — resumo de comissões/repasses (admin)
// POST /terapeutas/admin/:id/marcar-repasse — marcar repasse como pago (admin)
// PATCH /terapeutas/admin/:id/senha — definir/alterar senha (admin)

import { Router, Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '../lib/supabase'
import pool from '../lib/pgClient'

// Helper: query terapeutas via direct pg (bypasses PostgREST schema cache)
async function pgQuery(sql: string, params: unknown[] = []) {
  const client = await pool.connect()
  try {
    const res = await client.query(sql, params)
    return { rows: res.rows, error: null }
  } catch (e) {
    return { rows: [], error: (e as Error).message }
  } finally {
    client.release()
  }
}

const JWT_SECRET = process.env.TERAPEUTA_JWT_SECRET ?? 'euthycare-terapeuta-secret-change-me'

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const secret = req.headers['x-admin-secret']
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: 'Acesso negado' })
    return
  }
  next()
}

// Extend Request to carry terapeuta id after JWT verification
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

// ── iCal helpers ──────────────────────────────────────────────
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
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EuthyCare//PT',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:EuthyCare — ' + terapeutaNome,
    'X-WR-TIMEZONE:Europe/Lisbon',
    'METHOD:PUBLISH',
  ]

  for (const e of events) {
    const inicio = toIcsDt(e.data, e.hora)
    const fim    = toIcsDt(e.data, addMinutes(e.hora, e.duracaoMin))
    const desc   = e.videoUrl
      ? `Videochamada: ${e.videoUrl}\\nCliente: ${e.nomeCliente}`
      : `Cliente: ${e.nomeCliente}`

    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}@euthycare.com`,
      `DTSTAMP:${now}`,
      `DTSTART;TZID=Europe/Lisbon:${inicio}`,
      `DTEND;TZID=Europe/Lisbon:${fim}`,
      `SUMMARY:Consulta — ${e.nomeCliente}`,
      `DESCRIPTION:${desc}`,
      'LOCATION:Online (Videochamada)',
      ...(e.videoUrl ? [`URL:${e.videoUrl}`] : []),
      `STATUS:${e.status === 'confirmado' ? 'CONFIRMED' : 'TENTATIVE'}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Consulta em 15 minutos',
      'END:VALARM',
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

const router = Router()

// ── GET /terapeutas/cal/:token — feed iCal público (token secreto) ──
router.get('/cal/:token', async (req: Request, res: Response) => {
  const { token } = req.params

  const { rows: tRows } = await pgQuery(
    `SELECT id, nome, duracao_min FROM terapeutas WHERE calendario_token = $1`,
    [token]
  )
  if (tRows.length === 0) { res.status(404).send('Calendário não encontrado'); return }
  const terapeuta = tRows[0]

  // Agendamentos não cancelados dos próximos 6 meses
  const hoje = new Date().toISOString().slice(0, 10)
  const limite = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const { data: agendamentos } = await supabaseAdmin
    .from('agendamentos')
    .select('id, data, hora, status, nome_cliente, video_url')
    .eq('terapeuta_id', terapeuta.id)
    .not('status', 'eq', 'cancelado')
    .gte('data', hoje)
    .lte('data', limite)
    .order('data')
    .order('hora')

  const events = (agendamentos ?? []).map((a: Record<string, unknown>) => ({
    uid: a.id as string,
    data: a.data as string,
    hora: a.hora as string,
    duracaoMin: (terapeuta.duracao_min as number) ?? 50,
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

// ── POST /terapeutas/me/renovar-calendario — novo token ───────
router.post('/me/renovar-calendario', requireTerapeuta, async (req: Request, res: Response) => {
  const newToken = crypto.randomUUID()
  const { error } = await pgQuery(
    `UPDATE terapeutas SET calendario_token = $1 WHERE id = $2`,
    [newToken, req.terapeutaId!]
  )
  if (error) { res.status(500).json({ error: 'Erro ao renovar token' }); return }
  res.json({ calendario_token: newToken })
})

// ── POST /terapeutas/login ────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  const { email, senha } = req.body
  if (!email || !senha) {
    res.status(400).json({ error: 'email e senha obrigatórios' }); return
  }

  const { rows, error } = await pgQuery(
    `SELECT id, nome, email, senha_hash, ativo FROM terapeutas WHERE email = $1`,
    [email.toLowerCase().trim()]
  )

  if (error || rows.length === 0) {
    res.status(401).json({ error: 'Credenciais inválidas' }); return
  }
  const data = rows[0]
  if (!data.ativo) {
    res.status(403).json({ error: 'Conta inativa. Contacte a administração.' }); return
  }
  if (!data.senha_hash) {
    res.status(401).json({ error: 'Senha não definida. Contacte a administração.' }); return
  }

  const ok = await bcrypt.compare(senha, data.senha_hash)
  if (!ok) {
    res.status(401).json({ error: 'Credenciais inválidas' }); return
  }

  const token = jwt.sign({ sub: data.id, nome: data.nome }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, terapeuta: { id: data.id, nome: data.nome, email: data.email } })
})

// ── GET /terapeutas/me ────────────────────────────────────────
router.get('/me', requireTerapeuta, async (req: Request, res: Response) => {
  const { rows, error } = await pgQuery(
    `SELECT id, nome, titulo, bio, foto_url, especialidades, preco_cents, duracao_min, comissao_percentagem, email, calendario_token
     FROM terapeutas WHERE id = $1`,
    [req.terapeutaId!]
  )
  if (error || rows.length === 0) { res.status(404).json({ error: 'Terapeuta não encontrada' }); return }
  res.json({ terapeuta: rows[0] })
})

// ── GET /terapeutas/me/agenda?data=YYYY-MM-DD ─────────────────
router.get('/me/agenda', requireTerapeuta, async (req: Request, res: Response) => {
  const { data: dataParam } = req.query
  const id = req.terapeutaId!

  if (!dataParam || typeof dataParam !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dataParam)) {
    res.status(400).json({ error: 'Parâmetro "data" obrigatório no formato YYYY-MM-DD' }); return
  }

  const [agendamentos, bloqueios] = await Promise.all([
    supabaseAdmin
      .from('agendamentos')
      .select('id, hora, status, nome_cliente, email_cliente, notas, video_url')
      .eq('terapeuta_id', id)
      .eq('data', dataParam)
      .order('hora'),
    supabaseAdmin
      .from('bloqueios_agenda')
      .select('hora_inicio, hora_fim')
      .eq('terapeuta_id', id)
      .eq('data', dataParam),
  ])

  res.json({
    data: dataParam,
    agendamentos: agendamentos.data ?? [],
    bloqueios: bloqueios.data ?? [],
  })
})

// ── GET /terapeutas/me/repasses ───────────────────────────────
router.get('/me/repasses', requireTerapeuta, async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('agendamentos')
    .select('id, data, hora, valor_cobrado_cents, repasse_cents, comissao_cents, repasse_pago, nome_cliente')
    .eq('terapeuta_id', req.terapeutaId!)
    .eq('status', 'confirmado')
    .order('data', { ascending: false })

  if (error) { res.status(500).json({ error: error.message }); return }

  const total_repasse = (data ?? []).reduce((s, a) => s + (a.repasse_cents ?? 0), 0)
  const por_pagar = (data ?? []).reduce((s, a) => a.repasse_pago ? s : s + (a.repasse_cents ?? 0), 0)

  res.json({ agendamentos: data ?? [], total_repasse, por_pagar })
})

// ── GET /terapeutas ───────────────────────────────────────────
router.get('/', async (_req: Request, res: Response) => {
  const { rows, error } = await pgQuery(
    `SELECT id, nome, titulo, bio, foto_url, especialidades, preco_cents, duracao_min
     FROM terapeutas WHERE ativo = true ORDER BY nome`
  )
  if (error) { res.status(500).json({ error }); return }
  res.json({ terapeutas: rows })
})

// ── GET /terapeutas/:id ───────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  const { rows, error } = await pgQuery(
    `SELECT id, nome, titulo, bio, foto_url, especialidades, preco_cents, duracao_min
     FROM terapeutas WHERE id = $1 AND ativo = true`,
    [req.params.id]
  )
  if (error || rows.length === 0) { res.status(404).json({ error: 'Terapeuta não encontrada.' }); return }
  res.json({ terapeuta: rows[0] })
})

// ── GET /terapeutas/:id/slots?data=YYYY-MM-DD ─────────────────
router.get('/:id/slots', async (req: Request, res: Response) => {
  const { id } = req.params
  const { data: dataParam } = req.query

  if (!dataParam || typeof dataParam !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dataParam)) {
    res.status(400).json({ error: 'Parâmetro "data" obrigatório no formato YYYY-MM-DD' })
    return
  }

  const diaSemana = new Date(dataParam + 'T00:00:00').getDay()

  // Bloqueios do dia
  const { data: bloqueios } = await supabaseAdmin
    .from('bloqueios_agenda')
    .select('hora_inicio, hora_fim')
    .eq('terapeuta_id', id)
    .eq('data', dataParam)

  if (bloqueios?.some(b => !b.hora_inicio)) {
    res.json({ data: dataParam, slots: [] }); return
  }

  // Disponibilidade da terapeuta para o dia da semana
  const { data: disps } = await supabaseAdmin
    .from('disponibilidades')
    .select('hora_inicio, hora_fim, intervalo_min')
    .eq('terapeuta_id', id)
    .eq('dia_semana', diaSemana)
    .eq('ativo', true)

  if (!disps || disps.length === 0) {
    res.json({ data: dataParam, slots: [] }); return
  }

  const todosSlots: string[] = []
  for (const d of disps) {
    todosSlots.push(...gerarSlots(d.hora_inicio, d.hora_fim, d.intervalo_min ?? 60))
  }

  // Agendamentos existentes
  const { data: agendados } = await supabaseAdmin
    .from('agendamentos')
    .select('hora')
    .eq('terapeuta_id', id)
    .eq('data', dataParam)
    .not('status', 'eq', 'cancelado')

  const ocupados = new Set((agendados ?? []).map(a => a.hora.slice(0, 5)))

  // Bloqueios parciais
  const bloqueadosSlots = new Set<string>()
  for (const b of bloqueios ?? []) {
    if (b.hora_inicio && b.hora_fim) {
      gerarSlots(b.hora_inicio, b.hora_fim).forEach(s => bloqueadosSlots.add(s))
    }
  }

  const livres = [...new Set(todosSlots)].sort().filter(
    s => !ocupados.has(s) && !bloqueadosSlots.has(s)
  )

  res.json({ data: dataParam, slots: livres })
})

// ── Admin: criar terapeuta ────────────────────────────────────
router.post('/admin', requireAdmin, async (req: Request, res: Response) => {
  const { nome, titulo, bio, foto_url, especialidades, preco_cents, duracao_min, comissao_percentagem, email, senha } = req.body

  if (!nome) { res.status(400).json({ error: 'nome é obrigatório.' }); return }

  const insertData: Record<string, unknown> = {
    nome, titulo: titulo ?? '', bio: bio ?? '',
    foto_url: foto_url ?? null,
    especialidades: especialidades ?? '',
    preco_cents: preco_cents ?? 2500,
    duracao_min: duracao_min ?? 50,
    comissao_percentagem: comissao_percentagem ?? 20,
    ativo: true,
  }

  const emailVal = email ? email.toLowerCase().trim() : null
  const senhaHash = senha ? await bcrypt.hash(senha, 10) : null

  const { rows, error } = await pgQuery(
    `INSERT INTO terapeutas (nome, titulo, bio, foto_url, especialidades, preco_cents, duracao_min, comissao_percentagem, ativo, email, senha_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,$9,$10) RETURNING *`,
    [nome, titulo ?? '', bio ?? '', foto_url ?? null, especialidades ?? '',
     preco_cents ?? 2500, duracao_min ?? 50, comissao_percentagem ?? 20, emailVal, senhaHash]
  )
  if (error) { res.status(500).json({ error }); return }
  res.status(201).json({ terapeuta: rows[0] })
})

// ── Admin: editar terapeuta ───────────────────────────────────
router.patch('/admin/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params
  const b = req.body
  const fields: string[] = []
  const vals: unknown[] = []
  let i = 1
  const allowed = ['nome','titulo','bio','foto_url','especialidades','preco_cents','duracao_min','comissao_percentagem','ativo','email']
  for (const k of allowed) {
    if (k in b) { fields.push(`${k} = $${i++}`); vals.push(b[k]) }
  }
  if (b.senha) { fields.push(`senha_hash = $${i++}`); vals.push(await bcrypt.hash(b.senha, 10)) }
  if (fields.length === 0) { res.status(400).json({ error: 'Nenhum campo para actualizar' }); return }
  vals.push(id)
  const { rows, error } = await pgQuery(
    `UPDATE terapeutas SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, vals
  )
  if (error) { res.status(500).json({ error }); return }
  res.json({ terapeuta: rows[0] })
})

// ── Admin: eliminar terapeuta ─────────────────────────────────
router.delete('/admin/:id', requireAdmin, async (req: Request, res: Response) => {
  const { error } = await pgQuery(`DELETE FROM terapeutas WHERE id = $1`, [req.params.id])
  if (error) { res.status(500).json({ error }); return }
  res.json({ ok: true })
})

// ── Admin: disponibilidade da terapeuta ───────────────────────
router.get('/admin/:id/disponibilidade', requireAdmin, async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('disponibilidades')
    .select('*')
    .eq('terapeuta_id', req.params.id)
    .order('dia_semana')

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

router.put('/admin/:id/disponibilidade', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params
  const rows = (req.body as Array<Record<string, unknown>>).map(r => ({ ...r, terapeuta_id: id }))

  // Delete existing and re-insert
  await supabaseAdmin.from('disponibilidades').delete().eq('terapeuta_id', id)
  if (rows.length > 0) {
    const { error } = await supabaseAdmin.from('disponibilidades').insert(rows)
    if (error) { res.status(500).json({ error: error.message }); return }
  }
  res.json({ ok: true })
})

// ── Admin: resumo de repasses/comissões ───────────────────────
router.get('/admin/repasses/resumo', requireAdmin, async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('agendamentos')
    .select('terapeuta_id, repasse_cents, comissao_cents, repasse_pago, terapeutas(nome)')
    .eq('status', 'confirmado')

  if (error) { res.status(500).json({ error: error.message }); return }

  // Group by terapeuta
  const map = new Map<string, { nome: string; total_repasse: number; total_comissao: number; por_pagar: number }>()

  for (const a of data ?? []) {
    const tid = a.terapeuta_id as string
    if (!tid) continue
    const nome = (a.terapeutas as unknown as { nome: string } | null)?.nome ?? 'Desconhecida'
    const entry = map.get(tid) ?? { nome, total_repasse: 0, total_comissao: 0, por_pagar: 0 }
    entry.total_repasse += a.repasse_cents ?? 0
    entry.total_comissao += a.comissao_cents ?? 0
    if (!a.repasse_pago) entry.por_pagar += a.repasse_cents ?? 0
    map.set(tid, entry)
  }

  res.json({ repasses: Object.fromEntries(map) })
})

// ── Admin: definir/alterar senha da terapeuta ─────────────────
router.patch('/admin/:id/senha', requireAdmin, async (req: Request, res: Response) => {
  const { senha } = req.body
  if (!senha || senha.length < 6) {
    res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' }); return
  }
  const hash = await bcrypt.hash(senha, 10)
  const { error } = await pgQuery(
    `UPDATE terapeutas SET senha_hash = $1 WHERE id = $2`,
    [hash, req.params.id]
  )
  if (error) { res.status(500).json({ error }); return }
  res.json({ ok: true })
})

// ── Admin: marcar repasses como pagos ─────────────────────────
router.post('/admin/:id/marcar-repasse', requireAdmin, async (req: Request, res: Response) => {
  const { error } = await supabaseAdmin
    .from('agendamentos')
    .update({ repasse_pago: true })
    .eq('terapeuta_id', req.params.id)
    .eq('repasse_pago', false)
    .eq('status', 'confirmado')

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json({ ok: true })
})

export default router
