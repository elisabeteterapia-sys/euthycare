'use client'

import { useState, useEffect, useCallback } from 'react'
import { Gift, Copy, Check, Trash2, Plus, Loader2, Link2 } from 'lucide-react'

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').trim()
const STORAGE_KEY = 'oferta_form_state'

interface OfertaToken {
  id: string
  token: string
  url: string
  sessoes: number
  validade_dias: number
  usos_max: number | null
  usos_total: number
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const t = sessionStorage.getItem('terapeuta_token')
  return t ? { Authorization: `Bearer ${t}` } : {}
}

function loadFormState() {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') } catch { return {} }
}

export default function TerapeutaOfertaPage() {
  const [tokens, setTokens]         = useState<OfertaToken[]>([])
  const [carregando, setCarregando] = useState(true)
  const [criando, setCriando]       = useState(false)
  const [erro, setErro]             = useState('')
  const [copiado, setCopiado]       = useState<string | null>(null)

  const saved = loadFormState()
  const [sessoes, setSessoes]           = useState<number>(saved.sessoes ?? 1)
  const [validadeDias, setValidadeDias] = useState<number>(saved.validade_dias ?? 30)
  const [usosMax, setUsosMax]           = useState<number>(saved.usos_max ?? 1)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessoes, validade_dias: validadeDias, usos_max: usosMax }))
  }, [sessoes, validadeDias, usosMax])

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const r = await fetch(`${API}/oferta/terapeuta/listar`, { headers: getAuthHeader() })
      if (r.ok) setTokens(await r.json())
    } catch { /* ignore */ }
    setCarregando(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function criar() {
    setCriando(true); setErro('')
    try {
      const r = await fetch(`${API}/oferta/terapeuta/criar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ sessoes, validade_dias: validadeDias, usos_max: usosMax }),
      })
      const d = await r.json()
      if (!r.ok) { setErro(d.error ?? 'Erro ao criar link'); return }
      await carregar()
    } catch { setErro('Erro de ligação.') }
    finally { setCriando(false) }
  }

  async function remover(id: string) {
    if (!confirm('Desactivar este link? Os clientes que já o usaram mantêm o crédito.')) return
    await fetch(`${API}/oferta/terapeuta/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    })
    setTokens(prev => prev.filter(t => t.id !== id))
  }

  async function copiar(url: string, id: string) {
    await navigator.clipboard.writeText(url)
    setCopiado(id)
    setTimeout(() => setCopiado(null), 2000)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-sage-50 border border-sage-200 flex items-center justify-center">
          <Gift className="h-5 w-5 text-sage-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-sage-800">Sessão Gratuita</h1>
          <p className="text-sm text-sage-500">Crie links mágicos para oferecer consultas gratuitas</p>
        </div>
      </div>

      {/* Formulário */}
      <div className="bg-white rounded-2xl border border-sage-100 p-6 mb-6 shadow-soft">
        <h2 className="font-semibold text-sage-800 mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Novo link
        </h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Sessões</label>
            <input
              type="number" min={1} max={10}
              value={sessoes}
              onChange={e => setSessoes(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Validade (dias)</label>
            <input
              type="number" min={1} max={365}
              value={validadeDias}
              onChange={e => setValidadeDias(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Usos máx.</label>
            <input
              type="number" min={1} max={100}
              value={usosMax}
              onChange={e => setUsosMax(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
            />
          </div>
        </div>

        {erro && <p className="text-sm text-red-500 mb-3">{erro}</p>}

        <button
          onClick={criar}
          disabled={criando}
          className="flex items-center gap-2 px-5 py-2.5 bg-sage-500 hover:bg-sage-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {criando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          Gerar link
        </button>
      </div>

      {/* Lista de tokens activos */}
      <h2 className="font-semibold text-sage-700 mb-3 text-sm">Links activos</h2>
      {carregando ? (
        <div className="flex justify-center py-8 text-sage-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : tokens.length === 0 ? (
        <p className="text-sm text-sage-400 text-center py-8">Nenhum link activo.</p>
      ) : (
        <div className="space-y-3">
          {tokens.map(t => (
            <div key={t.id} className="bg-white rounded-2xl border border-sage-100 p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-sage-500 mb-1">
                    {t.sessoes} sessão{t.sessoes > 1 ? 'ões' : ''} ·{' '}
                    {t.validade_dias} dias ·{' '}
                    {t.usos_total}/{t.usos_max ?? '∞'} usos
                  </p>
                  <p className="text-xs font-mono text-sage-700 truncate">{t.url}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => copiar(t.url, t.id)}
                    className="p-2 rounded-lg bg-sage-50 hover:bg-sage-100 text-sage-600 transition-colors"
                    title="Copiar link"
                  >
                    {copiado === t.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => remover(t.id)}
                    className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 transition-colors"
                    title="Desactivar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
