// ─── Routes: /neuro ───────────────────────────────────────────
// Módulo Neuroplasticidade Aplicada — leitura pública dos estudos
// publicados pelo EuthyApp (mesmas tabelas app_neuro_*).
//
// GET  /neuro/estudos            — lista (estudo de hoje + recentes + próximos)
// GET  /neuro/estudos/:id        — detalhe de um estudo publicado

import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../lib/supabase'

const router = Router()

const LISBON_TZ = 'Europe/Lisbon'

function todayLisbon(): string {
  return new Date().toLocaleString('sv-SE', { timeZone: LISBON_TZ }).slice(0, 10)
}

// GET /neuro/estudos — agregado público
router.get('/estudos', async (_req: Request, res: Response) => {
  const today = todayLisbon()

  const [estudoHojeRes, recentesRes, proximosRes] = await Promise.all([
    supabaseAdmin
      .from('app_neuro_estudos')
      .select('id, titulo, tema_principal, texto_referencia, data_publicacao')
      .eq('data_publicacao', today)
      .maybeSingle(),
    supabaseAdmin
      .from('app_neuro_estudos')
      .select('id, titulo, tema_principal, data_publicacao')
      .lte('data_publicacao', today)
      .order('data_publicacao', { ascending: false })
      .limit(12),
    supabaseAdmin
      .from('app_neuro_cronograma')
      .select('id, tema, data_programada, status')
      .gt('data_programada', today)
      .in('status', ['aprovado_tema', 'gerado', 'publicado'])
      .order('data_programada', { ascending: true })
      .limit(3),
  ])

  res.json({
    today,
    estudo_hoje: estudoHojeRes.data ?? null,
    recentes:    recentesRes.data ?? [],
    proximos:    proximosRes.data ?? [],
  })
})

// GET /neuro/estudos/:id — detalhe; bloqueia datas futuras
router.get('/estudos/:id', async (req: Request, res: Response) => {
  const { data: estudo, error } = await supabaseAdmin
    .from('app_neuro_estudos')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle()

  if (error || !estudo) {
    res.status(404).json({ error: 'Estudo não encontrado.' })
    return
  }

  if (estudo.data_publicacao > todayLisbon()) {
    res.status(403).json({ error: 'Estudo ainda não disponível.', data_publicacao: estudo.data_publicacao })
    return
  }

  res.json(estudo)
})

export default router
