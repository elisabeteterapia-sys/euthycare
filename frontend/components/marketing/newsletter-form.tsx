'use client'

import { useState } from 'react'
import { Mail, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface Props {
  origem?: string
  variant?: 'default' | 'compact'
}

export function NewsletterForm({ origem = 'site', variant = 'default' }: Props) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, origem }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Erro ao subscrever.')
      } else {
        setDone(true)
      }
    } catch {
      setError('Erro de ligação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-sage-600 text-sm font-medium">
        <CheckCircle2 className="h-5 w-5" />
        Subscrito! Obrigada por se juntar a nós.
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <form onSubmit={submit} className="flex gap-2 w-full max-w-sm">
        <Input
          type="email"
          placeholder="O seu email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="flex-1 text-sm"
        />
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subscrever'}
        </Button>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </form>
    )
  }

  return (
    <div className="rounded-2xl bg-sage-50 border border-sage-100 p-8 text-center">
      <div className="h-12 w-12 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-4">
        <Mail className="h-6 w-6 text-sage-500" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">Receba dicas de bem-estar</h3>
      <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">
        Artigos sobre ansiedade, burnout e saúde emocional. Sem spam — só conteúdo com valor.
      </p>
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
        <Input
          type="email"
          placeholder="O seu endereço de email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="flex-1"
        />
        <Button type="submit" disabled={loading} className="gap-2 whitespace-nowrap">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          {loading ? 'A subscrever…' : 'Subscrever'}
        </Button>
      </form>
      {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
      <p className="text-xs text-gray-400 mt-3">Pode cancelar a subscrição a qualquer momento.</p>
    </div>
  )
}
