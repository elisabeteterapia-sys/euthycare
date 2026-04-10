// ─── Agendamento Routes ────────────────────────────────────────
// Sistema de agendamento da terapeuta principal.
//
// Endpoints públicos:
//   GET  /agendamento/slots?data=YYYY-MM-DD  — slots disponíveis para uma data
//   POST /agendamento                        — criar agendamento
//
// Endpoints admin (x-admin-secret):
//   GET    /agendamento/admin                       — listar agendamentos
//   PATCH  /agendamento/admin/:id                   — atualizar status
//   GET    /agendamento/admin/disponibilidade        — ler disponibilidade semanal
//   PUT    /agendamento/admin/disponibilidade        — salvar disponibilidade semanal
//   GET    /agendamento/admin/bloqueios              — listar bloqueios
//   POST   /agendamento/admin/bloqueios              — bloquear data
//   DELETE /agendamento/admin/bloqueios/:id          — remover bloqueio

import { Router, Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase'

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const secret = req.headers['x-admin-secret']
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: 'Acesso negado' })
    return
  }
  next()
}

const router = Router()

// ─── Helpers ──────────────────────────────────────────────────

/** Gera lista de slots (HH:MM) de hora em hora entre inicio e fim */
function gerarSlots(horaInicio: string, horaFim: string): string[] {
  const slots: string[] = []
  const [hi, mi] = horaInicio.split(':').map(Number)
  const [hf, mf] = horaFim.split(':').map(Number)
  const inicioMin = hi * 60 + mi
  const fimMin    = hf * 60 + mf

  for (let m = inicioMin; m < fimMin; m += 60) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0')
    const mm = String(m % 60).padStart(2, '0')
    slots.push(`${hh}:${mm}`)
  }
  return slots
}

/** Envia e-mail de confirmação (placeholder — conectar provedor de e-mail) */
async function enviarConfirmacao(params: {
  nome: string
  email: string
  data: string
  hora: string
}) {
  // TODO: integrar Resend / Nodemailer / SendGrid
  // Exemplo com Resend:
  // await resend.emails.send({
  //   from: 'noreply@euthycare.com',
  //   to: params.email,
  //   subject: `Agendamento confirmado — ${params.data} às ${params.hora}`,
  //   html: `<p>Olá ${params.nome}, o seu agendamento foi recebido.</p>`,
  // })
  console.log(
    `[agendamento] Confirmação para ${params.email} — ${params.data} às ${params.hora}`
  )
}

// ─── GET /agendamento/slots?data=YYYY-MM-DD ───────────────────
// Público: retorna slots disponíveis para a data informada
router.get('/slots', async (req: Request, res: Response) => {
  const { data: dataParam } = req.query
  if (!dataParam || typeof dataParam !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dataParam)) {
    res.status(400).json({ error: 'Parâmetro "data" obrigatório no formato YYYY-MM-DD' })
    return
  }

  const date = new Date(dataParam + 'T00:00:00')
  const diaSemana = date.getDay() // 0=Dom … 6=Sáb

  // 1. Verificar se o dia inteiro está bloqueado
  const { data: bloqueiosDia } = await supabaseAdmin
    .from('bloqueios_agenda')
    .select('id, hora_inicio, hora_fim')
    .eq('data', dataParam)

  const diaInteiroBloqueado = bloqueiosDia?.some(b => !b.hora_inicio)
  if (diaInteiroBloqueado) {
    res.json({ data: dataParam, slots: [] })
    return
  }

  // 2. Buscar disponibilidades ativas para o dia da semana
  const { data: disponibilidades, error: errDisp } = await supabaseAdmin
    .from('disponibilidades')
    .select('hora_inicio, hora_fim')
    .eq('dia_semana', diaSemana)
    .eq('ativo', true)

  if (errDisp) {
    res.status(500).json({ error: 'Erro ao consultar disponibilidades' })
    return
  }

  if (!disponibilidades || disponibilidades.length === 0) {
    res.json({ data: dataParam, slots: [] })
    return
  }

  // 3. Gerar todos os slots possíveis
  const todosSlots: string[] = []
  for (const d of disponibilidades) {
    todosSlots.push(...gerarSlots(d.hora_inicio, d.hora_fim))
  }

  // 4. Buscar agendamentos existentes na data (excluindo cancelados)
  const { data: agendamentos } = await supabaseAdmin
    .from('agendamentos')
    .select('hora')
    .eq('data', dataParam)
    .not('status', 'eq', 'cancelado')

  const horasOcupadas = new Set((agendamentos ?? []).map(a => a.hora.slice(0, 5)))

  // 5. Remover slots com bloqueios de horário parciais
  const horasBloqueadas = new Set<string>()
  for (const b of bloqueiosDia ?? []) {
    if (b.hora_inicio && b.hora_fim) {
      const bloqSlots = gerarSlots(b.hora_inicio, b.hora_fim)
      bloqSlots.forEach(s => horasBloqueadas.add(s))
    }
  }

  // 6. Filtrar e retornar slots livres
  const slotsLivres = [...new Set(todosSlots)].sort().filter(
    slot => !horasOcupadas.has(slot) && !horasBloqueadas.has(slot)
  )

  res.json({ data: dataParam, slots: slotsLivres })
})

// ─── POST /agendamento ────────────────────────────────────────
// Público: criar novo agendamento (requer crédito activo)
router.post('/', async (req: Request, res: Response) => {
  const { nome_cliente, email_cliente, data, hora, servico, modalidade, credito_id } = req.body

  if (!nome_cliente || !email_cliente || !data || !hora) {
    res.status(400).json({ error: 'Campos obrigatórios: nome_cliente, email_cliente, data, hora' })
    return
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !/^\d{2}:\d{2}$/.test(hora)) {
    res.status(400).json({ error: 'Formato inválido: data (YYYY-MM-DD), hora (HH:MM)' })
    return
  }

  // 1. Verificar crédito activo do cliente
  const hoje = new Date().toISOString().slice(0, 10)
  let creditoUsado: string | null = null

  if (credito_id) {
    // Cliente indicou crédito específico
    const { data: credito } = await supabaseAdmin
      .from('creditos_cliente')
      .select('id, sessoes_restantes, validade, status')
      .eq('id', credito_id)
      .eq('cliente_email', email_cliente)
      .single()

    if (!credito || credito.status !== 'ativo' || credito.sessoes_restantes < 1 || credito.validade < hoje) {
      res.status(402).json({ error: 'Crédito inválido ou expirado. Adquira um pacote para agendar.' })
      return
    }
    creditoUsado = credito.id
  } else {
    // Usar o primeiro crédito activo disponível
    const { data: creditos } = await supabaseAdmin
      .from('creditos_cliente')
      .select('id, sessoes_restantes, validade')
      .eq('cliente_email', email_cliente)
      .eq('status', 'ativo')
      .gt('validade', hoje)
      .gt('sessoes_restantes', 0)
      .order('validade')
      .limit(1)

    if (!creditos || creditos.length === 0) {
      res.status(402).json({ error: 'Sem créditos disponíveis. Adquira um pacote para agendar.' })
      return
    }
    creditoUsado = creditos[0].id
  }

  // 2. Verificar se o slot ainda está disponível
  const { data: existente } = await supabaseAdmin
    .from('agendamentos')
    .select('id')
    .eq('data', data)
    .eq('hora', hora)
    .not('status', 'eq', 'cancelado')
    .maybeSingle()

  if (existente) {
    res.status(409).json({ error: 'Horário já ocupado. Por favor escolha outro.' })
    return
  }

  const { data: novo, error } = await supabaseAdmin
    .from('agendamentos')
    .insert({
      nome_cliente,
      email_cliente,
      data,
      hora,
      credito_id: creditoUsado,
      ...(servico    ? { servico    } : {}),
      ...(modalidade ? { modalidade } : {}),
    })
    .select()
    .single()

  if (error) {
    // Unique constraint violada por race condition
    if (error.code === '23505') {
      res.status(409).json({ error: 'Horário já ocupado. Por favor escolha outro.' })
      return
    }
    res.status(500).json({ error: 'Erro ao criar agendamento' })
    return
  }

  // Enviar e-mail de confirmação (não bloqueia a resposta)
  enviarConfirmacao({ nome: nome_cliente, email: email_cliente, data, hora }).catch(
    err => console.error('[agendamento] Erro ao enviar e-mail:', err)
  )

  res.status(201).json({ agendamento: novo })
})

// ═══════════════════════════════════════════════════════════════
// ADMIN endpoints (/agendamento/admin/*)
// ═══════════════════════════════════════════════════════════════

// GET /agendamento/admin — listar agendamentos
router.get('/admin', requireAdmin, async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('agendamentos')
    .select('*')
    .order('data', { ascending: false })
    .order('hora', { ascending: true })

  if (error) { res.status(500).json({ error: 'Erro ao listar agendamentos' }); return }
  res.json(data)
})

// PATCH /agendamento/admin/:id — atualizar status
router.patch('/admin/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params
  const { status, data, hora } = req.body

  const statuses = ['pendente', 'confirmado', 'cancelado', 'remarcado']
  if (status && !statuses.includes(status)) {
    res.status(400).json({ error: `Status inválido. Use: ${statuses.join(', ')}` })
    return
  }

  const patch: Record<string, string> = {}
  if (status) patch.status = status
  if (data)   patch.data   = data
  if (hora)   patch.hora   = hora

  if (Object.keys(patch).length === 0) {
    res.status(400).json({ error: 'Nenhum campo para atualizar' })
    return
  }

  const { data: updated, error } = await supabaseAdmin
    .from('agendamentos')
    .update({ ...patch, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') { res.status(409).json({ error: 'Horário já ocupado' }); return }
    res.status(500).json({ error: 'Erro ao atualizar agendamento' })
    return
  }
  if (!updated) { res.status(404).json({ error: 'Agendamento não encontrado' }); return }

  res.json(updated)
})

// GET /agendamento/admin/disponibilidade
router.get('/admin/disponibilidade', requireAdmin, async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('disponibilidades')
    .select('*')
    .order('dia_semana')

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

// PUT /agendamento/admin/disponibilidade — upsert completo
router.put('/admin/disponibilidade', requireAdmin, async (req: Request, res: Response) => {
  const rows: Array<{ dia_semana: number; hora_inicio: string; hora_fim: string; intervalo_min: number; ativo: boolean }> = req.body
  if (!Array.isArray(rows)) { res.status(400).json({ error: 'Corpo deve ser array' }); return }

  const { error } = await supabaseAdmin
    .from('disponibilidades')
    .upsert(rows, { onConflict: 'dia_semana' })

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json({ ok: true })
})

// GET /agendamento/admin/bloqueios
router.get('/admin/bloqueios', requireAdmin, async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('bloqueios_agenda')
    .select('*')
    .order('data')

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

// POST /agendamento/admin/bloqueios
router.post('/admin/bloqueios', requireAdmin, async (req: Request, res: Response) => {
  const { data: date, motivo } = req.body
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: 'data inválida (YYYY-MM-DD)' })
    return
  }

  const { data, error } = await supabaseAdmin
    .from('bloqueios_agenda')
    .insert({ data: date, motivo: motivo ?? null })
    .select()
    .single()

  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(201).json(data)
})

// DELETE /agendamento/admin/bloqueios/:id
router.delete('/admin/bloqueios/:id', requireAdmin, async (req: Request, res: Response) => {
  const { error } = await supabaseAdmin
    .from('bloqueios_agenda')
    .delete()
    .eq('id', req.params.id)

  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(204).send()
})

export default router
