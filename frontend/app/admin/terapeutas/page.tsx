'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2, EyeOff, Eye, X, Loader2, Check, Euro, KeyRound, Link2, Upload, Package, Star } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? ''
const h = () => ({ 'x-admin-secret': SECRET, 'Content-Type': 'application/json' })

interface Terapeuta {
  id: string
  nome: string
  titulo: string
  bio: string
  foto_url: string | null
  especialidades: string
  preco_cents: number
  duracao_min: number
  comissao_percentagem: number
  ativo: boolean
  email?: string
  slug?: string
}

interface Pacote {
  id: string
  tipo: 'experimental' | 'pacote'
  nome: string
  numero_sessoes: number
  duracao_min: number
  preco: number
  validade_dias: number
  destaque: boolean
  descricao: string
  ativo: boolean
}

interface PacoteForm {
  tipo: 'experimental' | 'pacote'
  nome: string
  numero_sessoes: number
  duracao_min: number
  preco: number
  validade_dias: number
  destaque: boolean
  descricao: string
}

const emptyPacote: PacoteForm = {
  tipo: 'pacote', nome: '', numero_sessoes: 1, duracao_min: 50,
  preco: 0, validade_dias: 30, destaque: false, descricao: '',
}

const emptyForm = {
  nome: '', titulo: '', bio: '', foto_url: '',
  especialidades: '', preco_cents: 2500, duracao_min: 50, comissao_percentagem: 20,
  email: '', senha: '', slug: '',
}

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface Disp {
  dia_semana: number
  hora_inicio: string
  hora_fim: string
  intervalo_min: number
  ativo: boolean
}

export default function AdminTerapeutasPage() {
  const [terapeutas, setTerapeutas] = useState<Terapeuta[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Terapeuta | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [dispTab, setDispTab] = useState<string | null>(null)
  const [disps, setDisps] = useState<Disp[]>([])
  const [savingDisp, setSavingDisp] = useState(false)
  const [savedDisp, setSavedDisp] = useState(false)
  const [credTab, setCredTab] = useState<Terapeuta | null>(null)
  const [credSenha, setCredSenha] = useState('')
  const [credSaving, setCredSaving] = useState(false)
  const [credOk, setCredOk] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pacotesTab, setPacotesTab] = useState<Terapeuta | null>(null)
  const [pacotes, setPacotes] = useState<Pacote[]>([])
  const [pacoteForm, setPacoteForm] = useState<PacoteForm>(emptyPacote)
  const [editPacote, setEditPacote] = useState<Pacote | null>(null)
  const [savingPacote, setSavingPacote] = useState(false)
  const [deletingPacote, setDeletingPacote] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`${API}/terapeutas`, { headers: h() })
      const data = await res.json()
      setTerapeutas(data.terapeutas ?? [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditItem(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(t: Terapeuta) {
    setEditItem(t)
    setForm({
      nome: t.nome, titulo: t.titulo, bio: t.bio,
      foto_url: t.foto_url ?? '', especialidades: t.especialidades,
      preco_cents: t.preco_cents, duracao_min: t.duracao_min,
      comissao_percentagem: t.comissao_percentagem,
      email: t.email ?? '', senha: '', slug: t.slug ?? '',
    })
    setShowModal(true)
  }

  async function uploadFoto(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('foto', file)
      const r = await fetch(`${API}/terapeutas/admin/upload-foto`, {
        method: 'POST',
        headers: { 'x-admin-secret': SECRET },
        body: fd,
      })
      const d = await r.json()
      if (!r.ok) { alert(d.error ?? 'Erro ao fazer upload'); return }
      setForm(f => ({ ...f, foto_url: d.url }))
    } catch { alert('Erro de ligação') }
    finally { setUploading(false) }
  }

  async function guardarCredenciais() {
    if (!credTab || !credSenha.trim()) return
    setCredSaving(true)
    // Save email if changed
    await fetch(`${API}/terapeutas/admin/${credTab.id}`, {
      method: 'PATCH', headers: h(),
      body: JSON.stringify({ email: credTab.email }),
    })
    // Save password
    const r = await fetch(`${API}/terapeutas/admin/${credTab.id}/senha`, {
      method: 'PATCH', headers: h(),
      body: JSON.stringify({ senha: credSenha }),
    })
    setCredSaving(false)
    if (r.ok) {
      setCredOk(true)
      setTimeout(() => setCredOk(false), 2000)
      setCredSenha('')
      await load()
    } else {
      const j = await r.json()
      alert(j.error ?? 'Erro ao guardar')
    }
  }

  async function guardar() {
    setSaving(true)
    try {
      const url = editItem
        ? `${API}/terapeutas/admin/${editItem.id}`
        : `${API}/terapeutas/admin`
      const method = editItem ? 'PATCH' : 'POST'
      // Don't send empty senha on edit
      const payload = { ...form }
      if (editItem && !payload.senha) delete (payload as Record<string, unknown>).senha
      const res = await fetch(url, { method, headers: h(), body: JSON.stringify(payload) })
      const text = await res.text()
      if (!res.ok) {
        let msg = text
        try { msg = JSON.parse(text).error ?? text } catch { /* ignore */ }
        alert(`Erro: ${msg}`)
        setSaving(false)
        return
      }
      setShowModal(false)
      await load()
    } catch (e) {
      alert(`Erro de rede: ${(e as Error).message}`)
    }
    setSaving(false)
  }

  async function toggleAtivo(t: Terapeuta) {
    await fetch(`${API}/terapeutas/admin/${t.id}`, {
      method: 'PATCH', headers: h(), body: JSON.stringify({ ativo: !t.ativo }),
    })
    setTerapeutas(prev => prev.map(x => x.id === t.id ? { ...x, ativo: !x.ativo } : x))
  }

  async function confirmarDelete() {
    if (!deleteId) return
    await fetch(`${API}/terapeutas/admin/${deleteId}`, { method: 'DELETE', headers: h() })
    setTerapeutas(prev => prev.filter(t => t.id !== deleteId))
    setDeleteId(null)
  }

  async function abrirDisponibilidade(t: Terapeuta) {
    setDispTab(t.id)
    const res = await fetch(`${API}/terapeutas/admin/${t.id}/disponibilidade`, { headers: h() })
    const data = await res.json()
    const loaded: Disp[] = data ?? []
    // Fill missing days
    const result: Disp[] = DIAS.map((_, i) => {
      const existing = loaded.find(d => d.dia_semana === i)
      return existing ?? { dia_semana: i, hora_inicio: '09:00', hora_fim: '18:00', intervalo_min: 60, ativo: false }
    })
    setDisps(result)
  }

  async function abrirPacotes(t: Terapeuta) {
    setPacotesTab(t)
    setPacoteForm(emptyPacote)
    setEditPacote(null)
    const res = await fetch(`${API}/pacotes/admin/terapeuta/${t.id}`, { headers: h() })
    setPacotes(await res.json())
  }

  async function guardarPacote() {
    if (!pacotesTab) return
    setSavingPacote(true)
    try {
      const url = editPacote ? `${API}/pacotes/admin/${editPacote.id}` : `${API}/pacotes/admin`
      const method = editPacote ? 'PATCH' : 'POST'
      const body = editPacote
        ? pacoteForm
        : { ...pacoteForm, terapeuta_id: pacotesTab.id }
      const r = await fetch(url, { method, headers: h(), body: JSON.stringify(body) })
      const d = await r.json()
      if (!r.ok) { alert(d.error ?? 'Erro ao guardar pacote'); return }
      const res = await fetch(`${API}/pacotes/admin/terapeuta/${pacotesTab.id}`, { headers: h() })
      setPacotes(await res.json())
      setPacoteForm(emptyPacote)
      setEditPacote(null)
    } finally { setSavingPacote(false) }
  }

  async function eliminarPacote(id: string) {
    if (!pacotesTab) return
    setDeletingPacote(id)
    await fetch(`${API}/pacotes/admin/${id}`, { method: 'DELETE', headers: h() })
    const res = await fetch(`${API}/pacotes/admin/terapeuta/${pacotesTab.id}`, { headers: h() })
    setPacotes(await res.json())
    setDeletingPacote(null)
  }

  async function guardarDisponibilidade() {
    if (!dispTab) return
    setSavingDisp(true)
    const ativos = disps.filter(d => d.ativo)
    await fetch(`${API}/terapeutas/admin/${dispTab}/disponibilidade`, {
      method: 'PUT', headers: h(), body: JSON.stringify(ativos),
    })
    setSavingDisp(false)
    setSavedDisp(true)
    setTimeout(() => setSavedDisp(false), 2000)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400">
      <Loader2 className="h-5 w-5 animate-spin mr-2" /> A carregar…
    </div>
  )

  const terapeutaDisp = terapeutas.find(t => t.id === dispTab)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Terapeutas</h1>
          <p className="text-sm text-gray-400 mt-1">{terapeutas.length} terapeutas · {terapeutas.filter(t => t.ativo).length} activas</p>
        </div>
        <Button size="sm" className="gap-2" onClick={openNew}>
          <Plus className="h-4 w-4" /> Nova terapeuta
        </Button>
      </div>

      {/* Lista */}
      <div className="grid gap-4">
        {terapeutas.length === 0 && (
          <Card className="text-center py-12 text-gray-400">
            Nenhuma terapeuta ainda. Crie a primeira!
          </Card>
        )}
        {terapeutas.map(t => (
          <Card key={t.id} className={`flex items-center gap-4 ${!t.ativo ? 'opacity-60' : ''}`}>
            {/* Avatar */}
            <div className="h-12 w-12 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0 text-sage-600 font-bold text-lg">
              {t.foto_url
                ? <img src={t.foto_url} alt={t.nome} className="h-12 w-12 rounded-full object-cover" />
                : t.nome[0]}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{t.nome}</p>
              <p className="text-xs text-gray-400">{t.titulo}</p>
              {t.slug ? (
                <a href={`https://euthycare.com/t/${t.slug}`} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-sage-600 hover:underline mt-0.5">
                  <Link2 className="h-3 w-3" /> euthycare.com/t/{t.slug}
                </a>
              ) : (
                <p className="text-xs text-orange-400 mt-0.5">Sem link — defina um slug</p>
              )}
            </div>

            {/* Métricas */}
            <div className="hidden sm:flex items-center gap-6 text-sm text-gray-500">
              <div className="text-center">
                <p className="font-semibold text-gray-800">
                  {(t.preco_cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                </p>
                <p className="text-xs text-gray-400">sessão</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800">{t.comissao_percentagem}%</p>
                <p className="text-xs text-gray-400">comissão</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800">{t.duracao_min} min</p>
                <p className="text-xs text-gray-400">duração</p>
              </div>
            </div>

            <Badge variant={t.ativo ? 'sage' : 'cream'}>{t.ativo ? 'Activa' : 'Inactiva'}</Badge>

            {/* Acções */}
            <div className="flex items-center gap-1">
              <button onClick={() => abrirPacotes(t)} title="Pacotes"
                className="px-2 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-cream-300 hover:text-gray-800 transition-colors">
                Pacotes
              </button>
              <button onClick={() => abrirDisponibilidade(t)} title="Horários"
                className="px-2 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-cream-300 hover:text-gray-800 transition-colors">
                Horários
              </button>
              <button onClick={() => { setCredTab(t); setCredSenha(''); setCredOk(false) }} title="Credenciais de acesso"
                className="p-1.5 rounded-lg hover:bg-cream-300 text-gray-400 hover:text-gray-700 transition-colors">
                <KeyRound className="h-4 w-4" />
              </button>
              <button onClick={() => openEdit(t)} title="Editar"
                className="p-1.5 rounded-lg hover:bg-cream-300 text-gray-400 hover:text-gray-700 transition-colors">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => toggleAtivo(t)} title={t.ativo ? 'Desactivar' : 'Activar'}
                className="p-1.5 rounded-lg hover:bg-cream-300 text-gray-400 hover:text-gray-700 transition-colors">
                {t.ativo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button onClick={() => setDeleteId(t.id)} title="Eliminar"
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Pacotes modal */}
      {pacotesTab && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-cream-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pacotes — {pacotesTab.nome}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Pacotes visíveis na página pública da terapeuta</p>
              </div>
              <button onClick={() => { setPacotesTab(null); setEditPacote(null); setPacoteForm(emptyPacote) }}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Lista de pacotes */}
              {pacotes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Nenhum pacote ainda. Crie o primeiro abaixo.</p>
              ) : (
                <div className="space-y-2">
                  {pacotes.map(p => (
                    <div key={p.id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${p.ativo ? 'border-cream-300 bg-cream-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                      {p.destaque && <Star className="h-4 w-4 text-sage-500 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm">{p.nome}
                          <span className="ml-2 text-xs text-gray-400 font-normal">{p.tipo === 'experimental' ? '· experimental' : `· ${p.numero_sessoes} sessão${p.numero_sessoes > 1 ? 'ões' : ''}`}</span>
                        </p>
                        <p className="text-xs text-gray-400">{p.preco}€ · {p.validade_dias} dias{p.descricao ? ` · ${p.descricao.slice(0, 50)}…` : ''}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => { setEditPacote(p); setPacoteForm({ tipo: p.tipo, nome: p.nome, numero_sessoes: p.numero_sessoes, duracao_min: p.duracao_min, preco: p.preco, validade_dias: p.validade_dias, destaque: p.destaque, descricao: p.descricao ?? '' }) }}
                          className="p-1.5 rounded-lg hover:bg-cream-300 text-gray-400 hover:text-gray-700 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => eliminarPacote(p.id)} disabled={deletingPacote === p.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                          {deletingPacote === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulário criar/editar */}
              <div className="border-t border-cream-200 pt-5">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">{editPacote ? 'Editar pacote' : 'Novo pacote'}</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tipo</label>
                      <select value={pacoteForm.tipo} onChange={e => setPacoteForm(f => ({ ...f, tipo: e.target.value as 'experimental' | 'pacote' }))}
                        className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400">
                        <option value="pacote">Pacote</option>
                        <option value="experimental">Experimental</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Nome</label>
                      <input type="text" value={pacoteForm.nome} onChange={e => setPacoteForm(f => ({ ...f, nome: e.target.value }))}
                        placeholder="Ex: Essencial" className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Sessões</label>
                      <input type="number" min={1} value={pacoteForm.numero_sessoes} onChange={e => setPacoteForm(f => ({ ...f, numero_sessoes: parseInt(e.target.value) || 1 }))}
                        className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Duração</label>
                      <input type="number" min={15} step={5} value={pacoteForm.duracao_min} onChange={e => setPacoteForm(f => ({ ...f, duracao_min: parseInt(e.target.value) || 50 }))}
                        className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Preço (€)</label>
                      <input type="number" min={0} step={0.01} value={pacoteForm.preco || ''} onChange={e => setPacoteForm(f => ({ ...f, preco: parseFloat(e.target.value) || 0 }))}
                        className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Validade (dias)</label>
                      <input type="number" min={1} value={pacoteForm.validade_dias} onChange={e => setPacoteForm(f => ({ ...f, validade_dias: parseInt(e.target.value) || 30 }))}
                        className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Descrição (opcional)</label>
                    <input type="text" value={pacoteForm.descricao} onChange={e => setPacoteForm(f => ({ ...f, descricao: e.target.value }))}
                      placeholder="Breve descrição do pacote"
                      className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400" />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={pacoteForm.destaque} onChange={e => setPacoteForm(f => ({ ...f, destaque: e.target.checked }))}
                      className="rounded text-sage-500" />
                    <span className="text-sm text-gray-600">Destacar como popular</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end p-6 border-t border-cream-200">
              {editPacote && (
                <Button variant="outline" size="sm" onClick={() => { setEditPacote(null); setPacoteForm(emptyPacote) }}>
                  Cancelar edição
                </Button>
              )}
              <Button size="sm" onClick={guardarPacote} disabled={savingPacote || !pacoteForm.nome.trim() || !pacoteForm.preco} className="gap-2 min-w-[140px]">
                {savingPacote ? <><Loader2 className="h-4 w-4 animate-spin" /> A guardar…</> : editPacote ? 'Guardar alterações' : <><Package className="h-4 w-4" /> Criar pacote</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Disponibilidade modal */}
      {dispTab && terapeutaDisp && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-cream-200">
              <h3 className="text-lg font-semibold text-gray-900">Horários — {terapeutaDisp.nome}</h3>
              <button onClick={() => setDispTab(null)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-3">
              {disps.map((d, i) => (
                <div key={i} className={`rounded-xl border p-3 transition-colors ${d.ativo ? 'border-sage-300 bg-sage-50' : 'border-cream-300 bg-cream-50'}`}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setDisps(prev => prev.map((x, j) => j === i ? { ...x, ativo: !x.ativo } : x))}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors ${d.ativo ? 'bg-sage-500' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-3.5 w-3.5 mt-0.5 transform rounded-full bg-white shadow transition-transform ${d.ativo ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                    <span className="w-8 text-sm font-medium text-gray-700">{DIAS[d.dia_semana]}</span>
                    {d.ativo && (
                      <div className="flex items-center gap-2 flex-1">
                        <input type="time" value={d.hora_inicio}
                          onChange={e => setDisps(prev => prev.map((x, j) => j === i ? { ...x, hora_inicio: e.target.value } : x))}
                          className="h-8 px-2 rounded-lg border border-cream-400 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400" />
                        <span className="text-gray-400 text-xs">até</span>
                        <input type="time" value={d.hora_fim}
                          onChange={e => setDisps(prev => prev.map((x, j) => j === i ? { ...x, hora_fim: e.target.value } : x))}
                          className="h-8 px-2 rounded-lg border border-cream-400 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400" />
                        <select value={d.intervalo_min}
                          onChange={e => setDisps(prev => prev.map((x, j) => j === i ? { ...x, intervalo_min: parseInt(e.target.value) } : x))}
                          className="h-8 px-2 rounded-lg border border-cream-400 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400">
                          <option value={30}>30 min</option>
                          <option value={45}>45 min</option>
                          <option value={60}>60 min</option>
                          <option value={90}>90 min</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-cream-200">
              <Button variant="outline" size="sm" onClick={() => setDispTab(null)}>Fechar</Button>
              <Button size="sm" onClick={guardarDisponibilidade} disabled={savingDisp} className="gap-2 min-w-[120px]">
                {savingDisp ? <><Loader2 className="h-4 w-4 animate-spin" /> A guardar…</>
                  : savedDisp ? <><Check className="h-4 w-4" /> Guardado!</>
                  : 'Guardar horários'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials modal */}
      {credTab && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-cream-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Credenciais — {credTab.nome}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Acesso ao portal da terapeuta</p>
              </div>
              <button onClick={() => setCredTab(null)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email de login</label>
                <input
                  type="email"
                  value={credTab.email ?? ''}
                  onChange={e => setCredTab(prev => prev ? { ...prev, email: e.target.value } : prev)}
                  className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400"
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nova senha</label>
                <input
                  type="password"
                  value={credSenha}
                  onChange={e => setCredSenha(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="bg-sage-50 rounded-xl p-3 text-xs text-gray-600">
                <p>A terapeuta acederá em: <strong>euthycare.com/terapeuta/login</strong></p>
              </div>
            </div>
            <div className="flex gap-3 justify-end p-6 border-t border-cream-200">
              <Button variant="outline" size="sm" onClick={() => setCredTab(null)}>Cancelar</Button>
              <Button size="sm" onClick={guardarCredenciais} disabled={credSaving || !credSenha.trim()} className="gap-2 min-w-[140px]">
                {credSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> A guardar…</>
                  : credOk ? <><Check className="h-4 w-4" /> Guardado!</>
                  : 'Guardar credenciais'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Eliminar terapeuta</h3>
            <p className="text-sm text-gray-500 mb-6">Esta acção é irreversível.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>Cancelar</Button>
              <button onClick={confirmarDelete}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-cream-200">
              <h3 className="text-lg font-semibold text-gray-900">{editItem ? 'Editar terapeuta' : 'Nova terapeuta'}</h3>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <F label="Nome completo" value={form.nome} onChange={v => setForm(f => ({ ...f, nome: v }))} placeholder="Ex: Dra. Ana Silva" />
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Link público (slug) — ex: <em className="text-sage-600 not-italic">elisabete</em>
                </label>
                <div className="flex items-center gap-0">
                  <span className="h-10 flex items-center px-3 rounded-l-xl border border-r-0 border-cream-400 bg-cream-200 text-xs text-gray-500 select-none">
                    euthycare.com/t/
                  </span>
                  <input type="text" value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    placeholder="nome-da-terapeuta"
                    className="flex-1 h-10 px-3 rounded-r-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-400" />
                </div>
              </div>
              <F label="Título profissional" value={form.titulo} onChange={v => setForm(f => ({ ...f, titulo: v }))} placeholder="Ex: Psicóloga Clínica" />
              <F label="Especialidades" value={form.especialidades} onChange={v => setForm(f => ({ ...f, especialidades: v }))} placeholder="Ex: Ansiedade, Depressão, Burnout" />
              <F label="Biografia" value={form.bio} onChange={v => setForm(f => ({ ...f, bio: v }))} placeholder="Breve descrição" textarea />
              {/* Upload de foto */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Foto (PNG, JPG ou WebP · máx 5 MB)</label>
                <div className="flex items-center gap-3">
                  {form.foto_url && (
                    <img src={form.foto_url} alt="preview" className="h-14 w-14 rounded-xl object-cover border border-cream-300 flex-shrink-0" />
                  )}
                  <label className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-cream-400 bg-cream-100 text-sm text-gray-500 cursor-pointer hover:border-sage-400 hover:text-sage-600 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? 'A enviar…' : 'Escolher ficheiro'}
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadFoto(f) }} />
                  </label>
                  {form.foto_url && (
                    <button onClick={() => setForm(f => ({ ...f, foto_url: '' }))} className="text-xs text-red-400 hover:text-red-600">Remover</button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Preço (€)</label>
                  <input type="number" min={0} step={0.01}
                    value={form.preco_cents / 100 || ''}
                    onChange={e => setForm(f => ({ ...f, preco_cents: Math.round((parseFloat(e.target.value) || 0) * 100) }))}
                    className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Duração (min)</label>
                  <input type="number" min={15} step={5}
                    value={form.duracao_min}
                    onChange={e => setForm(f => ({ ...f, duracao_min: parseInt(e.target.value) || 50 }))}
                    className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Euro className="h-3 w-3" /> Comissão %
                  </label>
                  <input type="number" min={0} max={100}
                    value={form.comissao_percentagem}
                    onChange={e => setForm(f => ({ ...f, comissao_percentagem: parseInt(e.target.value) || 0 }))}
                    className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400" />
                </div>
              </div>

              {form.preco_cents > 0 && (
                <div className="bg-sage-50 rounded-xl p-3 text-xs text-gray-600">
                  <p>Preço: <strong>{(form.preco_cents / 100).toFixed(2)}€</strong></p>
                  <p>Comissão ({form.comissao_percentagem}%): <strong>{(form.preco_cents * form.comissao_percentagem / 10000).toFixed(2)}€</strong></p>
                  <p>Repasse à terapeuta: <strong>{(form.preco_cents * (100 - form.comissao_percentagem) / 10000).toFixed(2)}€</strong></p>
                </div>
              )}

              <div className="border-t border-cream-200 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Acesso ao portal (opcional)</p>
                <div className="space-y-3">
                  <F label="Email de login" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="email@exemplo.com" />
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      {editItem ? 'Nova senha (deixe em branco para não alterar)' : 'Senha inicial'}
                    </label>
                    <input type="password" value={form.senha}
                      onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-400" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end p-6 border-t border-cream-200">
              <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button size="sm" onClick={guardar} disabled={saving || !form.nome.trim()} className="gap-2 min-w-[120px]">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> A guardar…</> : editItem ? 'Guardar' : 'Criar terapeuta'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function F({ label, value, onChange, placeholder, textarea = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} placeholder={placeholder}
            className="w-full px-3 py-2.5 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-400 resize-none" />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-400" />
      }
    </div>
  )
}
