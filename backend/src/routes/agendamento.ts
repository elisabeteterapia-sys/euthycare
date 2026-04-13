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

const RESEND_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'noreply@euthycare.com'

function fmtDataHora(data: string, hora: string) {
  const d = new Date(data + 'T12:00:00')
  const dataFmt = d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return { dataFmt, hora: hora.slice(0, 5) }
}

/** Converte data+hora para formato ICS: YYYYMMDDTHHMMSS */
function toIcsDate(data: string, hora: string) {
  return data.replace(/-/g, '') + 'T' + hora.replace(':', '') + '00'
}

/** Adiciona minutos a uma hora HH:MM, devolve HH:MM */
function addMin(hora: string, min: number) {
  const [h, m] = hora.split(':').map(Number)
  const total = h * 60 + m + min
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/** Gera conteúdo .ics para um agendamento */
function gerarIcs(params: {
  uid: string; data: string; hora: string; duracaoMin: number
  titulo: string; descricao: string; videoUrl: string
}) {
  const inicio = toIcsDate(params.data, params.hora)
  const fim    = toIcsDate(params.data, addMin(params.hora, params.duracaoMin))
  const now    = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EuthyCare//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${params.uid}@euthycare.com`,
    `DTSTAMP:${now}`,
    `DTSTART;TZID=Europe/Lisbon:${inicio}`,
    `DTEND;TZID=Europe/Lisbon:${fim}`,
    `SUMMARY:${params.titulo}`,
    `DESCRIPTION:${params.descricao.replace(/\n/g, '\\n')}`,
    `LOCATION:Online (Videochamada)`,
    `URL:${params.videoUrl}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Lembrete da consulta EuthyCare',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

/** Gera link directo para adicionar ao Google Calendar */
function googleCalendarUrl(params: {
  data: string; hora: string; duracaoMin: number
  titulo: string; descricao: string; videoUrl: string
}) {
  const inicio = toIcsDate(params.data, params.hora)
  const fim    = toIcsDate(params.data, addMin(params.hora, params.duracaoMin))
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: params.titulo,
    dates: `${inicio}/${fim}`,
    details: params.descricao,
    location: `Online (Videochamada) — ${params.videoUrl}`,
    ctz: 'Europe/Lisbon',
  })
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}

async function sendEmail(to: string, subject: string, html: string, icsContent?: string) {
  if (!RESEND_KEY) { console.warn('[email] RESEND_API_KEY não definida'); return }
  const body: Record<string, unknown> = { from: FROM_EMAIL, to, subject, html }
  if (icsContent) {
    body.attachments = [{
      filename: 'consulta-euthycare.ics',
      content: Buffer.from(icsContent).toString('base64'),
    }]
  }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) console.error('[email] Resend error:', await r.text())
}

async function enviarConfirmacaoCliente(params: {
  uid: string; nome: string; email: string; data: string; hora: string
  videoUrl: string; duracaoMin?: number
}) {
  const { dataFmt, hora } = fmtDataHora(params.data, params.hora)
  const duracao = params.duracaoMin ?? 50
  const descricao = `Consulta EuthyCare\nData: ${dataFmt} às ${hora}\nVideochamada: ${params.videoUrl}`
  const gcUrl = googleCalendarUrl({
    data: params.data, hora: params.hora, duracaoMin: duracao,
    titulo: 'Consulta EuthyCare',
    descricao,
    videoUrl: params.videoUrl,
  })
  const ics = gerarIcs({
    uid: params.uid, data: params.data, hora: params.hora, duracaoMin: duracao,
    titulo: 'Consulta EuthyCare',
    descricao,
    videoUrl: params.videoUrl,
  })

  await sendEmail(
    params.email,
    `Consulta confirmada — ${dataFmt} às ${hora}`,
    `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#2d4534">
      <h2 style="color:#5c8a6b">EuthyCare</h2>
      <p>Olá <strong>${params.nome}</strong>,</p>
      <p>A sua consulta está confirmada:</p>
      <div style="background:#f2f7f4;border-radius:12px;padding:16px 20px;margin:20px 0">
        <p style="margin:0"><strong>Data:</strong> ${dataFmt}</p>
        <p style="margin:8px 0 0"><strong>Hora:</strong> ${hora}</p>
        <p style="margin:8px 0 0"><strong>Duração:</strong> ${duracao} minutos</p>
      </div>
      <table cellpadding="0" cellspacing="0" style="margin:8px 0">
        <tr>
          <td style="padding-right:8px">
            <a href="${params.videoUrl}" style="display:inline-block;background:#5c8a6b;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;font-size:14px">
              🎥 Entrar na videochamada
            </a>
          </td>
          <td>
            <a href="${gcUrl}" style="display:inline-block;background:#4285f4;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;font-size:14px">
              📅 Adicionar ao Google Calendar
            </a>
          </td>
        </tr>
      </table>
      <p style="font-size:13px;color:#7b9e87;margin-top:16px">
        O ficheiro de calendário (.ics) está em anexo — funciona com Google Calendar, Apple Calendar e Outlook.<br>
        Entre na videochamada alguns minutos antes da hora marcada.
      </p>
      <hr style="border:none;border-top:1px solid #e0ede5;margin:24px 0">
      <p style="font-size:12px;color:#97c2a8">EuthyCare · euthycare.com</p>
    </div>
    `,
    ics
  )
}

async function enviarNotificacaoTerapeuta(params: {
  uid: string; emailTerapeuta: string; nomeTerapeuta: string
  nomeCliente: string; data: string; hora: string; videoUrl: string; duracaoMin?: number
}) {
  const { dataFmt, hora } = fmtDataHora(params.data, params.hora)
  const duracao = params.duracaoMin ?? 50
  const descricao = `Cliente: ${params.nomeCliente}\nVideochamada: ${params.videoUrl}`
  const gcUrl = googleCalendarUrl({
    data: params.data, hora: params.hora, duracaoMin: duracao,
    titulo: `Consulta — ${params.nomeCliente}`,
    descricao,
    videoUrl: params.videoUrl,
  })
  const ics = gerarIcs({
    uid: params.uid + '-t', data: params.data, hora: params.hora, duracaoMin: duracao,
    titulo: `Consulta — ${params.nomeCliente}`,
    descricao,
    videoUrl: params.videoUrl,
  })

  await sendEmail(
    params.emailTerapeuta,
    `Nova consulta — ${params.nomeCliente} · ${dataFmt} às ${hora}`,
    `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#2d4534">
      <h2 style="color:#5c8a6b">EuthyCare</h2>
      <p>Olá <strong>${params.nomeTerapeuta}</strong>,</p>
      <p>Foi agendada uma nova consulta:</p>
      <div style="background:#f2f7f4;border-radius:12px;padding:16px 20px;margin:20px 0">
        <p style="margin:0"><strong>Cliente:</strong> ${params.nomeCliente}</p>
        <p style="margin:8px 0 0"><strong>Data:</strong> ${dataFmt}</p>
        <p style="margin:8px 0 0"><strong>Hora:</strong> ${hora}</p>
        <p style="margin:8px 0 0"><strong>Duração:</strong> ${duracao} minutos</p>
      </div>
      <table cellpadding="0" cellspacing="0" style="margin:8px 0">
        <tr>
          <td style="padding-right:8px">
            <a href="${params.videoUrl}" style="display:inline-block;background:#5c8a6b;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;font-size:14px">
              🎥 Link da videochamada
            </a>
          </td>
          <td>
            <a href="${gcUrl}" style="display:inline-block;background:#4285f4;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;font-size:14px">
              📅 Adicionar ao Google Calendar
            </a>
          </td>
        </tr>
      </table>
      <p style="font-size:13px;color:#7b9e87;margin-top:16px">O ficheiro .ics está em anexo.</p>
      <hr style="border:none;border-top:1px solid #e0ede5;margin:24px 0">
      <p style="font-size:12px;color:#97c2a8">EuthyCare · euthycare.com</p>
    </div>
    `,
    ics
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

  // Gerar URL da videochamada Jitsi e guardar no agendamento
  const videoUrl = `https://meet.jit.si/euthycare-${novo.id}`
  await supabaseAdmin
    .from('agendamentos')
    .update({ video_url: videoUrl })
    .eq('id', novo.id)

  const agendamentoFinal = { ...novo, video_url: videoUrl }

  // Enviar emails (não bloqueia a resposta)
  ;(async () => {
    try {
      // Buscar duração da terapeuta, se existir
      const tid = (novo as Record<string, unknown>).terapeuta_id as string | undefined
      let duracaoMin = 50
      let terapeutaEmail: string | undefined
      let terapeutaNome = 'Terapeuta'

      if (tid) {
        const { data: t } = await supabaseAdmin
          .from('terapeutas')
          .select('nome, email, duracao_min')
          .eq('id', tid)
          .single()
        if (t) {
          duracaoMin = t.duracao_min ?? 50
          terapeutaEmail = t.email
          terapeutaNome = t.nome
        }
      }

      await enviarConfirmacaoCliente({
        uid: novo.id, nome: nome_cliente, email: email_cliente,
        data, hora, videoUrl, duracaoMin,
      })

      const destTerapeuta = terapeutaEmail ?? process.env.ADMIN_EMAIL
      if (destTerapeuta) {
        await enviarNotificacaoTerapeuta({
          uid: novo.id, emailTerapeuta: destTerapeuta, nomeTerapeuta: terapeutaNome,
          nomeCliente: nome_cliente, data, hora, videoUrl, duracaoMin,
        })
      }
    } catch (e) {
      console.error('[agendamento] Erro ao enviar emails:', e)
    }
  })()

  res.status(201).json({ agendamento: agendamentoFinal })
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
