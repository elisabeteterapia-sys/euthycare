'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// Página de redirect para links curtos de pacotes: /p/abc123
// Resolve o código e redireciona para /t/[slug]?pacote=[id]
export default function ShortLinkPage() {
  const { codigo } = useParams<{ codigo: string }>()
  const router = useRouter()

  useEffect(() => {
    if (!codigo) return
    fetch(`${API}/pacotes/p/${codigo}`)
      .then(r => r.json())
      .then(d => {
        if (d.pacote_id && d.terapeuta_slug) {
          router.replace(`/t/${d.terapeuta_slug}?pacote=${d.pacote_id}`)
        } else {
          router.replace('/agendamento')
        }
      })
      .catch(() => router.replace('/agendamento'))
  }, [codigo, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-200">
      <div className="flex items-center gap-2 text-sage-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">A redirecionar…</span>
      </div>
    </div>
  )
}
