'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Pencil, X, Loader2 } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? ''

interface Campo {
  chave: string
  label: string
  tipo: 'text' | 'textarea'
}

const campos: Campo[] = [
  { chave: 'hero_titulo',    label: 'Título principal (hero)',        tipo: 'text' },
  { chave: 'hero_subtitulo', label: 'Subtítulo (hero)',               tipo: 'textarea' },
  { chave: 'hero_nota',      label: 'Nota abaixo dos botões',         tipo: 'text' },
  { chave: 'sobre_nome',     label: 'Nome da terapeuta',              tipo: 'text' },
  { chave: 'sobre_titulo',   label: 'Título profissional',            tipo: 'text' },
  { chave: 'sobre_bio',      label: 'Biografia curta',                tipo: 'textarea' },
  { chave: 'meta_titulo',    label: 'Título SEO (separador browser)', tipo: 'text' },
  { chave: 'meta_descricao', label: 'Descrição SEO (Google)',         tipo: 'textarea' },
]

const grupos = [
  { label: 'Página inicial', chaves: ['hero_titulo', 'hero_subtitulo', 'hero_nota'] },
  { label: 'Terapeuta',      chaves: ['sobre_nome', 'sobre_titulo', 'sobre_bio'] },
  { label: 'SEO',            chaves: ['meta_titulo', 'meta_descricao'] },
]

export default function AdminConteudoPage() {
  const [dados, setDados] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API}/conteudo`)
      .then(r => r.json())
      .then(d => { if (typeof d === 'object') setDados(d) })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  function startEdit(chave: string) {
    setEditingKey(chave)
    setEditValue(dados[chave] ?? '')
  }

  async function saveEdit(chave: string) {
    setSaving(true)
    try {
      await fetch(`${API}/conteudo/${chave}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': SECRET,
        },
        body: JSON.stringify({ valor: editValue }),
      })
      setDados(prev => ({ ...prev, [chave]: editValue }))
      setSaved(chave)
      setEditingKey(null)
      setTimeout(() => setSaved(null), 2000)
    } catch { /* ignore */ }
    setSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400">
      <Loader2 className="h-5 w-5 animate-spin mr-2" /> A carregar…
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Conteúdo do site</h1>
        <p className="text-sm text-gray-400 mt-1">Edite os textos que aparecem nas páginas públicas</p>
      </div>

      {grupos.map(grupo => (
        <div key={grupo.label}>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{grupo.label}</h2>
          <Card className="divide-y divide-cream-300 p-0 overflow-hidden">
            {campos.filter(c => grupo.chaves.includes(c.chave)).map(campo => (
              <div key={campo.chave} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{campo.label}</p>

                    {editingKey === campo.chave ? (
                      <div className="space-y-2">
                        {campo.tipo === 'textarea' ? (
                          <textarea
                            autoFocus
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 rounded-xl border border-sage-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400 resize-none"
                          />
                        ) : (
                          <input
                            autoFocus
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveEdit(campo.chave) }}
                            className="w-full h-10 px-3 rounded-xl border border-sage-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400"
                          />
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveEdit(campo.chave)} disabled={saving} className="gap-1">
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            Guardar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingKey(null)} className="gap-1">
                            <X className="h-3.5 w-3.5" /> Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {dados[campo.chave] || <span className="italic text-gray-300">Sem conteúdo</span>}
                      </p>
                    )}
                  </div>

                  {editingKey !== campo.chave && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {saved === campo.chave && (
                        <span className="text-xs text-sage-600 flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Guardado
                        </span>
                      )}
                      <button
                        onClick={() => startEdit(campo.chave)}
                        className="p-1.5 rounded-lg hover:bg-cream-300 text-gray-400 hover:text-gray-700 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </Card>
        </div>
      ))}
    </div>
  )
}
