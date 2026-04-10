'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Copy, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface ActivationKey {
  key: string
  plan: string
  activatedAt: string | null
  expiresAt: string | null
}

function SuccessContent() {
  const params = useSearchParams()
  const plan = params.get('plan') ?? 'pro'
  const [keyData, setKeyData] = useState<ActivationKey | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { setLoading(false); return }

    fetch(`${API}/billing/activation-key`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { setKeyData(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function copyKey() {
    if (!keyData) return
    navigator.clipboard.writeText(keyData.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-cream-200 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-sage-100 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-sage-500" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pagamento confirmado!</h1>
        <p className="text-gray-500 mb-8">
          Seu plano <strong className="text-sage-700 capitalize">{plan}</strong> está ativo. Bem-vindo ao Euthycare!
        </p>

        {/* Activation key card */}
        <Card className="text-left mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">Chave de ativação</p>
            <Badge variant="sage">Plano {plan}</Badge>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Gerando chave...</span>
            </div>
          ) : keyData ? (
            <>
              <div className="flex items-center gap-2 bg-cream-200 rounded-xl px-4 py-3 font-mono text-sm text-gray-800 mb-2">
                <span className="flex-1 tracking-widest">{keyData.key}</span>
                <button
                  onClick={copyKey}
                  className="text-sage-500 hover:text-sage-700 transition-colors"
                  title="Copiar"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              {copied && <p className="text-xs text-sage-600 font-medium">Copiado!</p>}
              <p className="text-xs text-gray-400 mt-2">
                Guarde esta chave. Use-a para ativar o plano em outros dispositivos.
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400">
              Acesse o dashboard para visualizar sua chave de ativação.
            </p>
          )}
        </Card>

        <div className="flex flex-col gap-3">
          <Link href="/dashboard">
            <Button className="w-full gap-2" size="lg">
              Ir para o Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard/billing">
            <Button variant="ghost" size="sm" className="w-full">
              Ver detalhes da assinatura
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
