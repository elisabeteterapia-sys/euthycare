'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Download, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface OrderResult {
  status: 'paid' | 'pending'
  download_token?: string
  produto_nome?: string
  email?: string
  message?: string
}

function SucessoContent() {
  const params = useSearchParams()
  const sessionId = params.get('session_id')

  const [state, setState] = useState<'loading' | 'paid' | 'pending' | 'error'>('loading')
  const [order, setOrder] = useState<OrderResult | null>(null)
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    if (!sessionId) {
      setState('error')
      return
    }

    let cancelled = false
    let timeout: ReturnType<typeof setTimeout>

    async function check() {
      try {
        const res = await fetch(`${API_URL}/loja/pedido/${sessionId}`)
        if (cancelled) return

        if (res.ok) {
          const data: OrderResult = await res.json()
          setOrder(data)
          setState(data.status === 'paid' ? 'paid' : 'pending')

          // Retry if still pending (webhook may be delayed)
          if (data.status === 'pending' && attempts < 6) {
            timeout = setTimeout(() => {
              setAttempts((a) => a + 1)
            }, 3000)
          } else if (data.status === 'pending') {
            setState('pending') // show manual instructions
          }
        } else {
          setState('error')
        }
      } catch {
        if (!cancelled) setState('error')
      }
    }

    check()
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, attempts])

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-gray-500">
        <Loader2 className="h-10 w-10 animate-spin text-sage-400" />
        <p className="text-sm">A confirmar o pagamento…</p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="rounded-3xl bg-red-50 border border-red-200 p-10 text-center max-w-md mx-auto">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-4" />
        <h2 className="font-bold text-gray-900 mb-2">Algo correu mal</h2>
        <p className="text-sm text-gray-500 mb-6">
          Não conseguimos confirmar o seu pedido. Se efetuou o pagamento,
          entre em contacto connosco com o e-mail usado no checkout.
        </p>
        <Link href="/contato">
          <Button variant="outline">Contactar suporte</Button>
        </Link>
      </div>
    )
  }

  if (state === 'pending') {
    return (
      <div className="rounded-3xl bg-amber-50 border border-amber-200 p-10 text-center max-w-md mx-auto">
        <Loader2 className="h-10 w-10 text-amber-400 mx-auto mb-4 animate-spin" />
        <h2 className="font-bold text-gray-900 mb-2">Pagamento em processamento</h2>
        <p className="text-sm text-gray-500 mb-6">
          O pagamento está a ser confirmado. Receberá um e-mail com o link de
          download assim que estiver pronto.
        </p>
        <Link href="/loja">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar à loja
          </Button>
        </Link>
      </div>
    )
  }

  // paid
  const downloadUrl = `${API_URL}/loja/download/${order?.download_token}`

  return (
    <div className="rounded-3xl bg-white border border-sage-200 p-10 text-center max-w-lg mx-auto shadow-sm">
      <div className="h-16 w-16 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="h-8 w-8 text-sage-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Obrigado pela compra!
      </h2>
      {order?.produto_nome && (
        <p className="text-sage-600 font-medium mb-1">{order.produto_nome}</p>
      )}
      {order?.email && (
        <p className="text-sm text-gray-400 mb-8">
          Confirmação enviada para {order.email}
        </p>
      )}

      {/* Download button — opens the backend redirect which validates token and logs */}
      <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
        <Button size="lg" className="w-full gap-2 mb-4">
          <Download className="h-5 w-5" />
          Transferir PDF
        </Button>
      </a>

      <p className="text-xs text-gray-400 mb-2">
        O link é gerado no momento do clique e expira em 60 segundos.
      </p>
      <p className="text-xs text-gray-400 mb-8">
        Pode transferir até 10 vezes com esta compra. Guarde o ficheiro localmente.
      </p>

      <Link href="/loja" className="text-sm text-sage-600 hover:underline">
        Ver mais produtos
      </Link>
    </div>
  )
}

export default function SucessoPage() {
  return (
    <section className="page-section min-h-[70vh] flex items-center">
      <div className="container-app w-full">
        <Suspense fallback={
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-sage-400" />
          </div>
        }>
          <SucessoContent />
        </Suspense>
      </div>
    </section>
  )
}
