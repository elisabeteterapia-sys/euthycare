'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Leaf, Loader2, CheckCircle2, AlertCircle, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface TokenInfo {
  sessoes: number
  validade_dias: number
  terapeuta_slug: string | null
}

export default function OfertaPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()

  const [info, setInfo]         = useState<TokenInfo | null>(null)
  const [loading, setLoading]   = useState(true)
  const [invalido, setInvalido] = useState(false)
  const [erroMsg, setErroMsg]   = useState('')

  const [nome, setNome]         = useState('')
  const [email, setEmail]       = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro]         = useState('')

  useEffect(() => {
    fetch(`${API}/oferta/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(setInfo)
      .catch(async (r) => {
        try {
          const d = await r.json()
          setErroMsg(d.error ?? 'Link inválido.')
        } catch { setErroMsg('Link inválido ou expirado.') }
        setInvalido(true)
      })
      .finally(() => setLoading(false))
  }, [token])

  async function handleResgatar(e: { preventDefault(): void }) {
    e.preventDefault()
    setEnviando(true); setErro('')
    try {
      const r = await fetch(`${API}/oferta/${token}/resgatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email }),
      })
      const d = await r.json()
      if (!r.ok) { setErro(d.error ?? 'Erro ao activar oferta.'); return }
      router.push(d.url)
    } catch { setErro('Erro de ligação. Tente novamente.') }
    finally { setEnviando(false) }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-sage-400" />
    </div>
  )

  if (invalido) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-6">
      <AlertCircle className="h-12 w-12 text-red-400" />
      <h1 className="text-xl font-bold text-gray-900">Link inválido</h1>
      <p className="text-gray-500 max-w-sm">{erroMsg}</p>
      <Link href="/" className="text-sage-600 text-sm hover:underline">Voltar ao site</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-cream-100 to-lilac-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-sage-700 text-lg mb-1">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center">
              <Leaf className="h-4.5 w-4.5 text-white" />
            </div>
            Euthy<span className="text-sage-400">care</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-card border border-cream-200 p-7">
          {/* Oferta badge */}
          <div className="flex items-center justify-center mb-5">
            <div className="h-14 w-14 rounded-2xl bg-sage-50 border border-sage-200 flex items-center justify-center">
              <Gift className="h-7 w-7 text-sage-500" />
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 text-center mb-1">
            Sessão gratuita para si
          </h1>
          <p className="text-sm text-gray-500 text-center mb-6">
            {info!.sessoes} sessão{info!.sessoes > 1 ? 'ões' : ''} · válida{info!.sessoes > 1 ? 's' : ''} {info!.validade_dias} dias após activação
          </p>

          <form onSubmit={handleResgatar} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">O seu nome</label>
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Nome completo"
                className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">E-mail *</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="o-seu@email.com"
                className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
              />
            </div>

            {erro && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /> {erro}
              </div>
            )}

            <Button type="submit" loading={enviando} disabled={!email} className="w-full gap-2 mt-1">
              <CheckCircle2 className="h-4 w-4" /> Activar e agendar consulta
            </Button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            Ao activar, aceita os{' '}
            <Link href="/termos" className="hover:underline">Termos de Serviço</Link>
            {' '}e{' '}
            <Link href="/privacidade" className="hover:underline">Política de Privacidade</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
