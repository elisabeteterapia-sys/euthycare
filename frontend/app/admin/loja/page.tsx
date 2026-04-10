'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2, EyeOff, Eye, X, Check } from 'lucide-react'

type Tipo = 'experimental' | 'pacote'

interface Produto {
  id: string
  nome: string
  descricao: string
  tipo: Tipo
  sessoes: number
  preco: number
  ativo: boolean
}

const produtosIniciais: Produto[] = [
  { id: '1', nome: 'Consulta Experimental', descricao: 'Primeira consulta de 50 min', tipo: 'experimental', sessoes: 1,  preco: 25,  ativo: true  },
  { id: '2', nome: 'Pacote Início',         descricao: '3 sessões de acompanhamento',  tipo: 'pacote',        sessoes: 3,  preco: 120, ativo: true  },
  { id: '3', nome: 'Pacote Evolução',       descricao: '6 sessões de acompanhamento',  tipo: 'pacote',        sessoes: 6,  preco: 220, ativo: true  },
  { id: '4', nome: 'Pacote Transformação',  descricao: '10 sessões + suporte extra',   tipo: 'pacote',        sessoes: 10, preco: 340, ativo: false },
]

const emptyForm = { nome: '', descricao: '', tipo: 'pacote' as Tipo, sessoes: 1, preco: 0 }

export default function AdminLojaPage() {
  const [produtos, setProdutos] = useState<Produto[]>(produtosIniciais)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPreco, setEditPreco] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function startEdit(p: Produto) {
    setEditingId(p.id)
    setEditPreco(String(p.preco))
  }

  function savePreco(id: string) {
    const val = parseFloat(editPreco)
    if (!isNaN(val) && val > 0) {
      setProdutos(prev => prev.map(p => p.id === id ? { ...p, preco: val } : p))
    }
    setEditingId(null)
  }

  function toggleAtivo(id: string) {
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, ativo: !p.ativo } : p))
  }

  function deleteProduto(id: string) {
    setProdutos(prev => prev.filter(p => p.id !== id))
    setDeleteId(null)
  }

  function addProduto() {
    if (!form.nome.trim() || form.preco <= 0) return
    const novo: Produto = {
      id: String(Date.now()),
      ...form,
      ativo: true,
    }
    setProdutos(prev => [...prev, novo])
    setForm(emptyForm)
    setShowModal(false)
  }

  const ativos = produtos.filter(p => p.ativo).length
  const receita = produtos.filter(p => p.ativo).reduce((s, p) => s + p.preco, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loja</h1>
          <p className="text-sm text-gray-400 mt-1">{produtos.length} produtos · {ativos} activos</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" /> Novo produto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total produtos', value: produtos.length },
          { label: 'Activos',        value: ativos },
          { label: 'Receita potencial', value: `€${receita}` },
        ].map(s => (
          <Card key={s.label} className="text-center">
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-300 bg-cream-200/50">
              {['Produto', 'Tipo', 'Sessões', 'Preço', 'Estado', 'Acções'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-300">
            {produtos.map(p => (
              <tr key={p.id} className={`transition-colors ${p.ativo ? 'hover:bg-cream-200/40' : 'bg-gray-50 opacity-60'}`}>
                <td className="px-5 py-3.5">
                  <p className="font-medium text-gray-800">{p.nome}</p>
                  <p className="text-xs text-gray-400">{p.descricao}</p>
                </td>
                <td className="px-5 py-3.5">
                  <Badge variant={p.tipo === 'experimental' ? 'amber' : 'sage'} className="capitalize">{p.tipo}</Badge>
                </td>
                <td className="px-5 py-3.5 text-gray-600">{p.sessoes}</td>
                <td className="px-5 py-3.5">
                  {editingId === p.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">€</span>
                      <input
                        autoFocus
                        value={editPreco}
                        onChange={e => setEditPreco(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') savePreco(p.id); if (e.key === 'Escape') setEditingId(null) }}
                        className="w-20 h-7 px-2 text-sm border border-sage-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-400"
                      />
                      <button onClick={() => savePreco(p.id)} className="text-sage-600 hover:text-sage-700"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(p)} className="flex items-center gap-1.5 group">
                      <span className="font-semibold text-gray-800">€{p.preco}</span>
                      <Pencil className="h-3.5 w-3.5 text-gray-300 group-hover:text-sage-500 transition-colors" />
                    </button>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <Badge variant={p.ativo ? 'sage' : 'cream'}>{p.ativo ? 'Activo' : 'Inactivo'}</Badge>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAtivo(p.id)}
                      title={p.ativo ? 'Desactivar' : 'Activar'}
                      className="p-1.5 rounded-lg hover:bg-cream-300 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      {p.ativo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => setDeleteId(p.id)}
                      title="Eliminar"
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Eliminar produto</h3>
            <p className="text-sm text-gray-500 mb-6">Esta acção é irreversível. O produto será removido permanentemente.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>Cancelar</Button>
              <button
                onClick={() => deleteProduto(deleteId)}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New product modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Novo produto</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nome</label>
                <input
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Pacote Premium"
                  className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Descrição</label>
                <input
                  value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  placeholder="Breve descrição do produto"
                  className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={e => setForm(f => ({ ...f, tipo: e.target.value as Tipo }))}
                    className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400"
                  >
                    <option value="pacote">Pacote</option>
                    <option value="experimental">Experimental</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sessões</label>
                  <input
                    type="number" min={1}
                    value={form.sessoes}
                    onChange={e => setForm(f => ({ ...f, sessoes: parseInt(e.target.value) || 1 }))}
                    className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Preço (€)</label>
                <input
                  type="number" min={0} step={0.01}
                  value={form.preco || ''}
                  onChange={e => setForm(f => ({ ...f, preco: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-400"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button size="sm" onClick={addProduto} disabled={!form.nome.trim() || form.preco <= 0}>
                Adicionar produto
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
