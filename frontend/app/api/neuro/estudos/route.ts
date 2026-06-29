/**
 * GET /api/neuro/estudos
 * Lista pública dos estudos Neuroplasticidade (publicados pelo EuthyApp).
 * Lê app_neuro_estudos e app_neuro_cronograma directamente do Supabase
 * via service_role (server-only). Sem dependência do backend VPS.
 */
import { NextResponse } from 'next/server'

const SUPABASE_URL  = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const LISBON_TZ     = 'Europe/Lisbon'

function todayLisbon(): string {
  return new Date().toLocaleString('sv-SE', { timeZone: LISBON_TZ }).slice(0, 10)
}

async function supaQuery<T>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey:        SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`Supabase ${res.status}: ${await res.text()}`)
  }
  return res.json() as Promise<T>
}

export async function GET() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ error: 'Supabase env vars não configuradas no servidor.' }, { status: 500 })
  }

  const today = todayLisbon()

  try {
    const [estudoHojeArr, recentes, proximos] = await Promise.all([
      supaQuery<Array<Record<string, unknown>>>(
        `app_neuro_estudos?select=id,titulo,tema_principal,texto_referencia,data_publicacao&data_publicacao=eq.${today}&limit=1`,
      ),
      supaQuery<Array<Record<string, unknown>>>(
        `app_neuro_estudos?select=id,titulo,tema_principal,data_publicacao&data_publicacao=lte.${today}&order=data_publicacao.desc&limit=12`,
      ),
      supaQuery<Array<Record<string, unknown>>>(
        `app_neuro_cronograma?select=id,tema,data_programada,status&data_programada=gt.${today}&status=in.(aprovado_tema,gerado,publicado)&order=data_programada.asc&limit=3`,
      ),
    ])

    return NextResponse.json({
      today,
      estudo_hoje: estudoHojeArr[0] ?? null,
      recentes,
      proximos,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
