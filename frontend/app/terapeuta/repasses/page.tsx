'use client'

import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface Agendamento {
  id: string
  data: string
  hora: string
  nome_cliente: string
  valor_cobrado_cents: number
  repasse_cents: number
  comissao_cents: number
  repasse_pago: boolean
}

function euros(cents: number) {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €'
}

function fmtData(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-PT')
}

export default function TerapeutaRepasses() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [totalRepasse, setTotalRepasse] = useState(0)
  const [porPagar, setPorPagar] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = sessionStorage.getItem('terapeuta_token')
    fetch(`${API}/terapeutas/me/repasses`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(json => {
        setAgendamentos(json.agendamentos ?? [])
        setTotalRepasse(json.total_repasse ?? 0)
        setPorPagar(json.por_pagar ?? 0)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-12 text-sage-400">A carregar repasses...</div>

  const pagos = agendamentos.filter(a => a.repasse_pago)
  const aPagar = agendamentos.filter(a => !a.repasse_pago)

  return (
    <div>
      <h1 className="text-2xl font-bold text-sage-800 mb-6">Os Meus Repasses</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-sage-100 p-5 shadow-soft">
          <p className="text-xs text-sage-400 uppercase tracking-wide mb-1">Total acumulado</p>
          <p className="text-2xl font-bold text-sage-700">{euros(totalRepasse)}</p>
        </div>
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
          <p className="text-xs text-amber-500 uppercase tracking-wide mb-1">Por receber</p>
          <p className="text-2xl font-bold text-amber-700">{euros(porPagar)}</p>
        </div>
        <div className="bg-sage-50 rounded-2xl border border-sage-200 p-5">
          <p className="text-xs text-sage-400 uppercase tracking-wide mb-1">Já recebido</p>
          <p className="text-2xl font-bold text-sage-600">{euros(totalRepasse - porPagar)}</p>
        </div>
      </div>

      {/* Pending */}
      {aPagar.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-sage-600 uppercase tracking-wide mb-3">Por receber</h2>
          <div className="space-y-2">
            {aPagar.map(a => (
              <div key={a.id} className="bg-white rounded-xl border border-amber-200 p-4 flex items-center gap-4">
                <div className="text-center min-w-[60px]">
                  <p className="text-xs text-sage-400">{fmtData(a.data)}</p>
                  <p className="text-sm font-semibold text-sage-700">{a.hora.slice(0, 5)}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-sage-800">{a.nome_cliente}</p>
                  <p className="text-xs text-sage-400">Sessão: {euros(a.valor_cobrado_cents)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-amber-700">{euros(a.repasse_cents)}</p>
                  <p className="text-xs text-sage-400">comissão: {euros(a.comissao_cents)}</p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-600 border border-amber-200 rounded-full px-2 py-0.5 font-medium">
                  Pendente
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paid */}
      {pagos.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-sage-600 uppercase tracking-wide mb-3">Recebido</h2>
          <div className="space-y-2">
            {pagos.map(a => (
              <div key={a.id} className="bg-white rounded-xl border border-sage-100 p-4 flex items-center gap-4 opacity-75">
                <div className="text-center min-w-[60px]">
                  <p className="text-xs text-sage-400">{fmtData(a.data)}</p>
                  <p className="text-sm font-semibold text-sage-700">{a.hora.slice(0, 5)}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-sage-800">{a.nome_cliente}</p>
                  <p className="text-xs text-sage-400">Sessão: {euros(a.valor_cobrado_cents)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-sage-600">{euros(a.repasse_cents)}</p>
                  <p className="text-xs text-sage-400">comissão: {euros(a.comissao_cents)}</p>
                </div>
                <span className="text-xs bg-sage-100 text-sage-600 border border-sage-200 rounded-full px-2 py-0.5 font-medium">
                  Pago
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {agendamentos.length === 0 && (
        <div className="bg-white rounded-2xl border border-sage-100 p-8 text-center">
          <p className="text-sage-400">Sem sessões confirmadas ainda</p>
        </div>
      )}
    </div>
  )
}
