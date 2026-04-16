'use client'

import { useEffect, useState } from 'react'
import { useTerapeuta } from '../context'
import { Loader2, Check, Upload, Camera } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface Perfil {
  id: string
  nome: string
  titulo: string
  bio: string
  foto_url: string | null
  especialidades: string
  email: string
  preco_cents: number
  duracao_min: number
  comissao_percentagem: number
}

export default function TerapeutaPerfil() {
  const terapeuta = useTerapeuta()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    nome: '', titulo: '', bio: '', foto_url: '', especialidades: '',
  })
  const [uploadingFoto, setUploadingFoto] = useState(false)

  useEffect(() => {
    const token = sessionStorage.getItem('terapeuta_token')
    fetch(`${API}/terapeutas/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        const t = d.terapeuta
        setPerfil(t)
        setForm({
          nome: t.nome ?? '',
          titulo: t.titulo ?? '',
          bio: t.bio ?? '',
          foto_url: t.foto_url ?? '',
          especialidades: t.especialidades ?? '',
        })
      })
      .finally(() => setLoading(false))
  }, [])

  async function uploadFoto(file: File) {
    setUploadingFoto(true)
    try {
      const token = sessionStorage.getItem('terapeuta_token')
      const fd = new FormData()
      fd.append('foto', file)
      const r = await fetch(`${API}/terapeutas/me/upload-foto`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const d = await r.json()
      if (!r.ok) { setErro(d.error ?? 'Erro ao fazer upload'); return }
      setForm(f => ({ ...f, foto_url: d.url }))
    } catch { setErro('Erro de ligação') }
    finally { setUploadingFoto(false) }
  }

  async function guardar() {
    setErro('')
    setSaving(true)
    const token = sessionStorage.getItem('terapeuta_token')
    const res = await fetch(`${API}/terapeutas/me`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } else {
      const j = await res.json()
      setErro(j.error ?? 'Erro ao guardar')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-sage-400">
      <Loader2 className="h-5 w-5 animate-spin mr-2" /> A carregar...
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-sage-800 mb-6">O meu perfil</h1>

      <div className="bg-white rounded-2xl border border-sage-100 shadow-soft overflow-hidden">
        {/* Avatar com upload */}
        <div className="bg-sage-50 px-6 py-8 flex items-center gap-5 border-b border-sage-100">
          <label className="relative h-20 w-20 rounded-full bg-sage-200 flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer group">
            {form.foto_url
              ? <img src={form.foto_url} alt={form.nome} className="h-20 w-20 object-cover" />
              : <span className="text-3xl font-bold text-sage-500">{form.nome.charAt(0)}</span>
            }
            {/* Overlay ao hover */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              {uploadingFoto
                ? <Loader2 className="h-6 w-6 text-white animate-spin" />
                : <Camera className="h-6 w-6 text-white" />
              }
            </div>
            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadFoto(f) }} />
          </label>
          <div>
            <p className="font-bold text-sage-800 text-lg">{form.nome || '—'}</p>
            <p className="text-sage-500 text-sm">{form.titulo || '—'}</p>
            <p className="text-sage-400 text-xs mt-1">{perfil?.email}</p>
            <p className="text-sage-300 text-xs mt-0.5">Clique na foto para alterar</p>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <Field label="Nome completo" value={form.nome}
            onChange={v => setForm(f => ({ ...f, nome: v }))} />
          <Field label="Título profissional" value={form.titulo}
            onChange={v => setForm(f => ({ ...f, titulo: v }))}
            placeholder="Ex: Psicóloga Clínica" />
          <Field label="Especialidades" value={form.especialidades}
            onChange={v => setForm(f => ({ ...f, especialidades: v }))}
            placeholder="Ex: Ansiedade, Depressão, Burnout" />
          <Field label="Biografia" value={form.bio}
            onChange={v => setForm(f => ({ ...f, bio: v }))}
            placeholder="Apresentação para os clientes..." textarea />
          {/* Info só leitura */}
          {perfil && (
            <div className="mt-2 pt-4 border-t border-sage-100 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-sage-700">
                  {(perfil.preco_cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                </p>
                <p className="text-xs text-sage-400">por sessão</p>
              </div>
              <div>
                <p className="text-lg font-bold text-sage-700">{perfil.duracao_min} min</p>
                <p className="text-xs text-sage-400">duração</p>
              </div>
              <div>
                <p className="text-lg font-bold text-sage-700">{perfil.comissao_percentagem}%</p>
                <p className="text-xs text-sage-400">comissão</p>
              </div>
            </div>
          )}

          {erro && <p className="text-sm text-red-500">{erro}</p>}
        </div>

        <div className="flex justify-end px-6 pb-6">
          <button
            onClick={guardar}
            disabled={saving}
            className="flex items-center gap-2 bg-sage-400 hover:bg-sage-500 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors min-w-[140px] justify-center"
          >
            {saving
              ? <><Loader2 className="h-4 w-4 animate-spin" /> A guardar...</>
              : saved
              ? <><Check className="h-4 w-4" /> Guardado!</>
              : 'Guardar perfil'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, textarea = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-sage-500 uppercase tracking-wide mb-1.5">{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={4} placeholder={placeholder}
            className="w-full px-3 py-2.5 rounded-xl border border-sage-200 bg-cream-50 text-sm text-sage-800 placeholder:text-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-300 resize-none" />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className="w-full h-10 px-3 rounded-xl border border-sage-200 bg-cream-50 text-sm text-sage-800 placeholder:text-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-300" />
      }
    </div>
  )
}
