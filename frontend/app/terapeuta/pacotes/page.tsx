'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Loader2, CheckCircle2, AlertCircle, X, Copy, Link2, Send, Lock } from 'lucide-react'
import { useTerapeuta } from '../context'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface Pacote {
  id: string
  tipo: 'experimental' | 'pacote'
  nome: string
  numero_sessoes: number
  duracao_min: number
  preco: number
  moeda: string
  validade_dias: number
  destaque: boolean
  descricao: string | null
  ativo: boolean
  publico: boolean
  codigo?: string | null
}

const VAZIO: Omit<Pacote, 'id' | 'moeda' | 'ativo' | 'publico'> = {
  tipo: 'pacote', nome: '', numero_sessoes: 1, duracao_min: 50,
  preco: 0, validade_dias: 30, destaque: false, descricao: '',
}

function getToken() {
  return typeof window !== 'undefined' ? sessionStorage.getItem('terapeuta_token') ?? '' : ''
}
function authHeader() {
  return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' }
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://euthycare.com'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copiar() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={copiar}
      className="flex items-center gap-1 text-xs text-sage-600 hover:text-sage-800 border border-sage-200 hover:border-sage-400 rounded-lg px-2.5 py-1.5 transition-colors bg-white"
    >
      {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-sage-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copiado!' : 'Copiar'}
    </button>
  )
}

export default function PacotesPage() {
  const terapeuta               = useTerapeuta()
  const [pacotes, setPacotes]   = useState<Pacote[]>([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState<'criar' | 'editar' | null>(null)
  const [form, setForm]         = useState({ ...VAZIO })
  const [privado, setPrivado]   = useState(false)
  const [clienteEmail, setClienteEmail] = useState('')
  const [clienteNome, setClienteNome]   = useState('')
  const [editId, setEditId]     = useState<string | null>(null)
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState<{ ok: boolean; text: string } | null>(null)
  // Estado após criar proposta privada
  const [proposta, setProposta] = useState<{ id: string; link: string; linkCurto: string } | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado]   = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    const r = await fetch(`${API}/pacotes/meus`, { headers: authHeader() })
    if (r.ok) setPacotes(await r.json())
    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  function abrirCriar() {
    setForm({ ...VAZIO }); setEditId(null); setModal('criar'); setMsg(null)
    setPrivado(false); setClienteEmail(''); setClienteNome('')
    setProposta(null); setEnviado(false)
  }

  function abrirEditar(p: Pacote) {
    setForm({
      tipo: p.tipo, nome: p.nome, numero_sessoes: p.numero_sessoes,
      duracao_min: p.duracao_min, preco: p.preco, validade_dias: p.validade_dias,
      destaque: p.destaque, descricao: p.descricao ?? '',
    })
    setEditId(p.id); setModal('editar'); setMsg(null)
  }

  async function guardar() {
    if (!form.nome || !form.numero_sessoes) return
    setSaving(true); setMsg(null)
    try {
      const body = JSON.stringify({ ...form, publico: !privado, ativo: true })
      const url    = editId ? `${API}/pacotes/meus/${editId}` : `${API}/pacotes/meus`
      const method = editId ? 'PATCH' : 'POST'
      const r = await fetch(url, { method, headers: authHeader(), body })
      if (r.ok) {
        const d = await r.json()
        await carregar()
        if (!editId && privado && terapeuta?.slug) {
          // Proposta privada: mostrar link em destaque em vez de fechar o modal
          const link = `${SITE}/t/${terapeuta.slug}?pacote=${d.id}`
          const linkCurto = d.codigo ? `${SITE}/p/${d.codigo}` : link
          setProposta({ id: d.id, link, linkCurto })
          setMsg(null)
        } else {
          setMsg({ ok: true, text: editId ? 'Pacote actualizado.' : 'Pacote criado.' })
          setTimeout(() => setModal(null), 900)
        }
      } else {
        const d = await r.json()
        setMsg({ ok: false, text: d.error ?? 'Erro ao guardar.' })
      }
    } catch { setMsg({ ok: false, text: 'Erro de ligação.' }) }
    finally { setSaving(false) }
  }

  async function enviarProposta() {
    if (!proposta || !clienteEmail || !terapeuta?.slug) return
    setEnviando(true)
    try {
      const r = await fetch(`${API}/pacotes/meus/${proposta.id}/enviar-cliente`, {
        method: 'POST', headers: authHeader(),
        body: JSON.stringify({
          cliente_email:  clienteEmail,
          cliente_nome:   clienteNome || null,
          terapeuta_nome: terapeuta.nome,
          terapeuta_slug: terapeuta.slug,
        }),
      })
      if (r.ok) setEnviado(true)
    } finally { setEnviando(false) }
  }

  async function toggleAtivo(p: Pacote) {
    await fetch(`${API}/pacotes/meus/${p.id}`, {
      method: 'PATCH', headers: authHeader(),
      body: JSON.stringify({ ativo: !p.ativo }),
    })
    carregar()
  }

  async function eliminar(id: string) {
    if (!confirm('Eliminar este pacote?')) return
    await fetch(`${API}/pacotes/meus/${id}`, { method: 'DELETE', headers: authHeader() })
    carregar()
  }

  function setF<K extends keyof typeof VAZIO>(k: K, v: typeof VAZIO[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sage-800">Os meus pacotes</h1>
          <p className="text-sm text-sage-500 mt-1">Defina os preços e pacotes visíveis para os seus clientes.</p>
        </div>
        <button
          onClick={abrirCriar}
          className="flex items-center gap-2 bg-sage-400 hover:bg-sage-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
        >
          <Plus className="h-4 w-4" /> Novo pacote
        </button>
      </div>

      {/* ── Links de divulgação ─────────────────────────── */}
      {terapeuta?.slug && (
        <div className="bg-sage-50 border border-sage-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sage-700 font-semibold text-sm">
            <Link2 className="h-4 w-4" /> Links de divulgação
          </div>
          <p className="text-xs text-sage-600">Partilhe estes links com os seus clientes para que possam pagar directamente.</p>

          {/* Link da página */}
          <div className="bg-white rounded-xl border border-sage-200 px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 mb-0.5">Página completa</p>
              <p className="text-sm text-sage-700 truncate">{SITE}/t/{terapeuta.slug}</p>
            </div>
            <CopyButton text={`${SITE}/t/${terapeuta.slug}`} />
          </div>

          {/* Links por pacote — usa link curto se disponível */}
          {pacotes.filter(p => p.ativo && p.publico).map(p => {
            const linkCurto = p.codigo ? `${SITE}/p/${p.codigo}` : `${SITE}/t/${terapeuta.slug}?pacote=${p.id}`
            return (
              <div key={p.id} className="bg-white rounded-xl border border-sage-200 px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500 mb-0.5">{p.nome}</p>
                  <p className="text-sm font-semibold text-sage-700 truncate">{linkCurto}</p>
                </div>
                <CopyButton text={linkCurto} />
              </div>
            )
          })}
        </div>
      )}

      {/* Lista de pacotes */}
      {loading ? (
        <div className="flex justify-center py-12 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> A carregar…
        </div>
      ) : pacotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sage-100 p-10 text-center text-gray-400 shadow-soft">
          <p className="font-medium mb-1">Sem pacotes criados</p>
          <p className="text-sm">Crie o seu primeiro pacote para os clientes verem na sua página.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pacotes.map(p => (
            <div key={p.id} className={`bg-white rounded-2xl border shadow-soft p-5 flex flex-col gap-3 ${p.ativo ? 'border-sage-100' : 'border-gray-200 opacity-60'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${p.tipo === 'experimental' ? 'bg-lilac-100 text-lilac-600' : 'bg-sage-100 text-sage-600'}`}>
                    {p.tipo === 'experimental' ? 'Experimental' : 'Pacote'}
                  </span>
                  <p className="font-semibold text-gray-800 mt-1">{p.nome}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-bold text-sage-700">{p.preco}€</p>
                  <p className="text-xs text-gray-400">{p.numero_sessoes} sessão{p.numero_sessoes > 1 ? 'ões' : ''}</p>
                </div>
              </div>

              {p.descricao && <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{p.descricao}</p>}

              <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                <span>{p.duracao_min} min/sessão</span>
                <span>·</span>
                <span>Válido {p.validade_dias} dias</span>
                {p.destaque && <span className="text-sage-500 font-medium">⭐ Destaque</span>}
              </div>

              <div className="flex gap-2 pt-1 border-t border-cream-200">
                <button
                  onClick={() => abrirEditar(p)}
                  className="flex items-center gap-1 text-xs text-sage-600 hover:text-sage-800 px-2 py-1.5 rounded-lg hover:bg-sage-50 transition-colors"
                >
                  <Pencil className="h-3 w-3" /> Editar
                </button>
                <button
                  onClick={() => toggleAtivo(p)}
                  className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg transition-colors ${p.ativo ? 'text-amber-600 hover:bg-amber-50' : 'text-sage-600 hover:bg-sage-50'}`}
                >
                  {p.ativo ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => eliminar(p.id)}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors ml-auto"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar/editar */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-card max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">{modal === 'criar' ? 'Novo pacote' : 'Editar pacote'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>

            {/* ── Vista após criar proposta privada ── */}
            {proposta ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-sage-50 border border-sage-200 rounded-xl">
                  <CheckCircle2 className="h-4 w-4 text-sage-500 flex-shrink-0" />
                  <p className="text-sm text-sage-700 font-medium">Proposta criada! Partilhe o link abaixo.</p>
                </div>

                {/* Link curto em destaque */}
                <div className="bg-sage-50 border border-sage-200 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">🔗 Link de partilha</p>
                  <p className="text-base font-semibold text-sage-700 mb-2">{proposta.linkCurto}</p>
                  <CopyButton text={proposta.linkCurto} />
                </div>

                {/* Enviar por email */}
                {!enviado ? (
                  <div className="space-y-2 pt-1 border-t border-cream-200">
                    <p className="text-xs font-medium text-gray-600">Enviar por email ao cliente</p>
                    <input
                      type="text" placeholder="Nome do cliente (opcional)"
                      value={clienteNome}
                      onChange={e => setClienteNome(e.target.value)}
                      className="w-full border border-cream-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
                    />
                    <div className="flex gap-2">
                      <input
                        type="email" placeholder="email@cliente.com"
                        value={clienteEmail}
                        onChange={e => setClienteEmail(e.target.value)}
                        className="flex-1 border border-cream-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
                      />
                      <button
                        onClick={enviarProposta}
                        disabled={!clienteEmail || enviando}
                        className="flex items-center gap-1.5 bg-sage-400 hover:bg-sage-500 disabled:opacity-50 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors"
                      >
                        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Enviar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-sage-50 border border-sage-200 rounded-xl">
                    <CheckCircle2 className="h-4 w-4 text-sage-500" />
                    <p className="text-sm text-sage-700">Email enviado para {clienteEmail}!</p>
                  </div>
                )}

                <button onClick={() => setModal(null)}
                  className="w-full border border-cream-300 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-cream-50 transition-colors">
                  Fechar
                </button>
              </div>
            ) : (
            <div className="space-y-4">
              {/* Modo: Público ou Proposta Privada */}
              {modal === 'criar' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setPrivado(false)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${!privado ? 'bg-sage-400 text-white border-sage-400' : 'border-cream-300 text-gray-500 hover:border-sage-300'}`}
                  >
                    Público
                  </button>
                  <button
                    onClick={() => setPrivado(true)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors flex items-center justify-center gap-1.5 ${privado ? 'bg-lilac-500 text-white border-lilac-500' : 'border-cream-300 text-gray-500 hover:border-lilac-300'}`}
                  >
                    <Lock className="h-3.5 w-3.5" /> Proposta privada
                  </button>
                </div>
              )}
              {privado && (
                <div className="rounded-xl bg-lilac-50 border border-lilac-200 px-3 py-2 text-xs text-lilac-700">
                  Proposta personalizada — só acessível via link directo. Ideal para enviar a um cliente após a consulta experimental.
                </div>
              )}

              {/* Tipo */}
              <div className="flex gap-2">
                {(['pacote', 'experimental'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setF('tipo', t)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${form.tipo === t ? 'bg-sage-400 text-white border-sage-400' : 'border-cream-300 text-gray-500 hover:border-sage-300'}`}
                  >
                    {t === 'experimental' ? 'Experimental' : 'Pacote'}
                  </button>
                ))}
              </div>

              {/* Nome */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome do pacote *</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => setF('nome', e.target.value)}
                  placeholder="Ex: Sessão Individual, Pacote Mensal…"
                  className="w-full border border-cream-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
                />
              </div>

              {/* Preço e Sessões */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Preço (€) *</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.preco}
                    onChange={e => setF('preco', Number(e.target.value))}
                    className="w-full border border-cream-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nº de sessões *</label>
                  <input
                    type="number" min="1"
                    value={form.numero_sessoes}
                    onChange={e => setF('numero_sessoes', Number(e.target.value))}
                    className="w-full border border-cream-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
                  />
                </div>
              </div>

              {/* Duração e Validade */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Duração (min)</label>
                  <select
                    value={form.duracao_min}
                    onChange={e => setF('duracao_min', Number(e.target.value))}
                    className="w-full border border-cream-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
                  >
                    {[30, 45, 50, 60, 90].map(v => <option key={v} value={v}>{v} min</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Validade (dias)</label>
                  <input
                    type="number" min="1"
                    value={form.validade_dias}
                    onChange={e => setF('validade_dias', Number(e.target.value))}
                    className="w-full border border-cream-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descrição (opcional)</label>
                <textarea
                  rows={2}
                  value={form.descricao ?? ''}
                  onChange={e => setF('descricao', e.target.value)}
                  placeholder="Breve descrição do que inclui…"
                  className="w-full border border-cream-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 resize-none"
                />
              </div>

              {/* Destaque */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.destaque}
                  onChange={e => setF('destaque', e.target.checked)}
                  className="h-4 w-4 accent-sage-500"
                />
                <span className="text-sm text-gray-700">Marcar como destaque (⭐ Popular)</span>
              </label>

              {msg && (
                <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${msg.ok ? 'bg-sage-50 text-sage-700 border border-sage-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                  {msg.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {msg.text}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setModal(null)} className="flex-1 border border-cream-300 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-cream-50 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={guardar}
                  disabled={saving || !form.nome || !form.numero_sessoes}
                  className="flex-1 flex items-center justify-center gap-2 bg-sage-400 hover:bg-sage-500 disabled:opacity-50 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {modal === 'criar' ? (privado ? 'Criar proposta' : 'Criar pacote') : 'Guardar'}
                </button>
              </div>
            </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
