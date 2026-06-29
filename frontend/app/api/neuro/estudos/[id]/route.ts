/**
 * GET /api/neuro/estudos/[id]
 * Detalhe público de um estudo Neuroplasticidade.
 * Bloqueia datas futuras com 403.
 */
import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const LISBON_TZ    = 'Europe/Lisbon'

function todayLisbon(): string {
  return new Date().toLocaleString('sv-SE', { timeZone: LISBON_TZ }).slice(0, 10)
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ error: 'Supabase env vars não configuradas no servidor.' }, { status: 500 })
  }

  const { id } = await params

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/app_neuro_estudos?select=*&id=eq.${encodeURIComponent(id)}&limit=1`,
    {
      headers: {
        apikey:        SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      cache: 'no-store',
    },
  )

  if (!res.ok) {
    return NextResponse.json({ error: `Supabase ${res.status}` }, { status: 500 })
  }

  const rows = (await res.json()) as Array<Record<string, unknown>>
  const estudo = rows[0]

  if (!estudo) {
    return NextResponse.json({ error: 'Estudo não encontrado.' }, { status: 404 })
  }

  const dataPub = estudo.data_publicacao as string
  if (dataPub > todayLisbon()) {
    return NextResponse.json(
      { error: 'Estudo ainda não disponível.', data_publicacao: dataPub },
      { status: 403 },
    )
  }

  return NextResponse.json(estudo)
}
