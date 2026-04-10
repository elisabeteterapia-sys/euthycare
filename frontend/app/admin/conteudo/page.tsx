'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Pencil, X } from 'lucide-react'

interface Campo {
  chave: string
  label: string
  valor: string
  tipo: 'text' | 'textarea'
}

const camposIniciais: Campo[] = [
  { chave: 'hero_titulo',    label: 'Título principal (hero)',       valor: 'Cuidado mental acolhedor e acessível',                                             tipo: 'text' },
  { chave: 'hero_subtitulo', label: 'Subtítulo (hero)',              valor: 'Sessões de psicoterapia online, no conforto da sua casa. Apoio profissional para ansiedade, burnout, relações e bem-estar emocional.', tipo: 'textarea' },
  { chave: 'hero_nota',      label: 'Nota abaixo dos botões',        valor: 'Primeira consulta experimental · €25 · Sem compromisso',                           tipo: 'text' },
  { chave: 'sobre_nome',     label: 'Nome da terapeuta',             valor: 'Dra. Ana Silva',                                                                   tipo: 'text' },
  { chave: 'sobre_titulo',   label: 'Título profissional',           valor: 'Psicóloga Clínica',                                                                tipo: 'text' },
  { chave: 'sobre_bio',      label: 'Biografia curta',               valor: 'Especializada em ansiedade, burnout e bem-estar emocional.',                       tipo: 'textarea' },
  { chave: 'meta_titulo',    label: 'Título SEO (separador browser)', valor: 'EuthyCare — Psicoterapia Online',                                                 tipo: 'text' },
  { chave: 'meta_descricao', label: 'Descrição SEO (Google)',         valor: 'Cuidado mental acolhedor e acessível. Consultas de psicoterapia online.',         tipo: 'textarea' },
]

export default function AdminConteudoPage() {
  const [campos, setCampos] = useState<Campo[]>(camposIniciais)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saved, setSaved] = useState<string | null>(null)

  function startEdit(campo: Campo) {
    setEditingKey(campo.chave)
    setEditValue(campo.valor)
  }

  function saveEdit(chave: string) {
    setCampos(prev => prev.map(c => c.chave === chave ? { ...c, valor: editValue } : c))
    setSaved(chave)
    setEditingKey(null)
    setTimeout(() => setSaved(null), 2000)
  }

  function cancelEdit() {
    setEditingKey(null)
    setEditValue('')
  }

  const grupos = [
    { label: 'Página inicial', chaves: ['hero_titulo', 'hero_subtitulo', 'hero_nota'] },
    { label: 'Terapeuta', chaves: ['sobre_nome', 'sobre_titulo', 'sobre_bio'] },
    { label: 'SEO', chaves: ['meta_titulo', 'meta_descricao'] },
  ]

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
                            className="w-full h-10 px-3 rounded-xl border border-sage-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400"
                          />
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveEdit(campo.chave)} className="gap-1">
                            <Check className="h-3.5 w-3.5" /> Guardar
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit} className="gap-1">
                            <X className="h-3.5 w-3.5" /> Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700">{campo.valor}</p>
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
                        onClick={() => startEdit(campo)}
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
